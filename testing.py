import selenium
from seleniumwire import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.wait import WebDriverWait as wait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import requests
from bs4 import BeautifulSoup
import random
import os 
import time
from pokereval.card import Card
from pokereval.hand_evaluator import HandEvaluator

globalRankTranslation = {'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14}
globalSuitTranslation = {'S':1,'H':2,'D':3,'C':4}


def interceptor(request):
    del request.headers['Referer']
    request.headers['Referer'] = 'some_referer'
class User: 
    def __init__(self,firstName, lastName, email, password):
        self.firstName = firstName
        self.lastName = lastName
        self.email = email
        self.password = password
        options = webdriver.ChromeOptions()
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        options.add_argument('--ignore-certificate-errors')
        options.add_argument('--incognito')
        #remove headless option if you want to see the program work live 
        #options.add_argument('--headless')
        options.add_argument('user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36"')
        self.driver =webdriver.Chrome(ChromeDriverManager().install(), options=options)
        self.driver.request_interceptor = interceptor
        curURL=self.driver.current_url
        self.driver.get("http://localhost:3000")
        wait(self.driver,15).until(EC.url_changes(curURL))

        self.driver.maximize_window()
        self.register()
        self.login()
    
    def login(self):
        curURL=self.driver.current_url
        self.driver.find_element_by_xpath('//a[@href="'+"login/login.html"+'"]').click()
        wait(self.driver,15).until(EC.url_changes(curURL))
        self.driver.find_element_by_id("email").send_keys(self.email)
        self.driver.find_element_by_id("pass1").send_keys(self.password)
        assert(self.driver.find_element_by_id("submit_reg").is_enabled())
        self.driver.find_element_by_id("submit_reg").click()


    def register(self):
        self.driver.find_element_by_id("firstname").send_keys(self.firstName)
        self.driver.find_element_by_id("lastname").send_keys(self.lastName)
        self.driver.find_element_by_id("email").send_keys(self.email)
        self.driver.find_element_by_id("pass1").send_keys(self.password)
        self.driver.find_element_by_id("pass2").send_keys(self.password)
        assert(self.driver.find_element_by_id("submit_reg").is_enabled())
        self.driver.find_element_by_id("submit_reg").click()

    def logout(self):
        self.driver.find_element_by_id("logoutButton").click()
        self.driver.quit()

    def createGame(self):
        self.driver.find_element_by_id("joinButton").click()
        time.sleep(2)
        self.gameCode=self.driver.find_element_by_id("codeElement").text
        self.gameCode=self.gameCode.split()[1]
        self.isHost=True

    def joinGame(self,gameCode=random.randint(1000,5000)):
        self.driver.find_element_by_class_name("form-control").send_keys(gameCode)
        self.driver.find_element_by_id("joinButton").click()
        self.gameCode=gameCode
        time.sleep(2)

    def check(self):
        self.driver.find_element_by_xpath('//button[text()="Check"]').click()

    def match(self):
        self.driver.find_element_by_xpath('//button[text()="Match"]').click()

        
    def fold(self):
        self.driver.find_element_by_xpath('//button[text()="Fold"]').click()

    def raiseAmnt(self,amount):
        self.driver.find_element_by_class_name("numberInput").send_keys(str(amount))
        self.driver.find_element_by_xpath('//button[text()="Raise"]').click()
        self.driver.find_element_by_class_name("numberInput").clear()

    def getHand(self):
        self.hand=self.driver.find_element_by_id("currentHand").text
        self.hand= self.hand.split()[1]
        self.hand=self.hand.split()

    def getLog(self):
        logText=self.driver.find_element_by_id("gameLog").text
        logText=logText.split('\n')
        return logText

    def getAction(self):
        action=self.driver.find_element_by_id("action").text
        action=action.split()
        if action[-1]=="N/A":
            return["N/A"]
        else:
            return [action[2],action[3]]
        
    def getBoard(self):
        self.cardsOnTable=self.driver.find_element_by_id("commCards").text
        if(len(self.cardsOnTable)>15):
            self.cardsOnTable= self.hand.split()[3]
            self.cardsOnTable=self.hand.split()
        else:
            self.cardsOnTable=[]
        return self.cardsOnTable

    def getBalance(self):
        player=self.driver.find_element_by_id("players").text
        playerBalance=player.split('\n')
        for person in playerBalance:
            personInfo=person.split()
            if personInfo[-1] == "(you)" and personInfo[1]==self.firstName and personInfo[2]== self.lastName:
                self.balance=int(personInfo[0])
                assert(self.balance >=0)
                return self.balance
        raise ValueError("No balance found!")
    
    def printLoginInfo(self):
        print("Username: {}\nPassword:{}".format(self.email,self.password))

class Poker:
    def __init__(self,userArr):
        self.players=userArr

    def checkSync(self):
        #check if every user sees the same board
        hostBoard = self.players[0].getBoard()
        for player in self.players:
            if hostBoard != player.getBoard():
                return False 
        return True

    def checkWinner(self):
        for player in self.players:
            if len(player.getLog())>1:
                if player.getLog()[1] =="{} {} won the hand!".format(player.firstName,player.lastName):
                    return True
        return False

    def chooseAction(self,player,action="random"):
        translation={"check":0,"match":1,"fold":2,"raise":3}
        if action=="random":
            action=random.randint(0,3)
        else:
            action=action.lower().strip()
            if action not in translation:
                raise RuntimeError("invalid action "+action)
            else:
                action=translation[action]
        if action==0:
            player.check()   
        elif action==1:
            player.match()
        elif action==2:
            player.fold()
        elif action==3:
            player.raiseAmnt(random.randint(0,player.getBalance()//10))

    def chooseValidAction(self,player):
        invalidMoves=["Not your turn!", "Can't Check!", "Can't Match!","Raise amount must be greater than last raise"]
        self.chooseAction(player)
        while player.getLog()[0] in invalidMoves:
            self.chooseAction(player)

    def simulateGame(self):
        #simulate a singular game
        #everyone checks at first 
        for player in self.players:
            player.check()

        while not self.checkWinner():
            for player in self.players:
                if player.getAction() == [player.firstName,player.lastName]:
                    self.chooseValidAction(player)
    
    def printPlayers(self):
        for i in range(len(self.players)):
            print("Player {} info".format(i))
            self.players[i].printLoginInfo()

    def endGame(self):
        for player in self.players:
            player.logout()
        del self.players
        
        
if __name__ == "__main__":
    #Using random to create accounts that are not repeats, needs to be fixed once database is fixed
    n= random.random()
    andy= User("Andy","C","andy"+str(n)+"@gmail.com","1234")
    fred=User("Fred","L","fred"+str(n)+"@gmail.com","1234")
    jeff = User("Jeff","M","jeff"+str(n)+"@gmail.com","1234")
    jinnthon = User("Jinny","H","Jin"+str(n)+"@f.com","1234")

    andy.joinGame()
    fred.joinGame(andy.gameCode)
    jeff.joinGame(andy.gameCode)
    jinnthon.joinGame(andy.gameCode)

    game= Poker([andy,fred,jeff,jinnthon])
    gameCount=5
    for i in range(gameCount):
        print("Game {}\n".format(i))
        game.simulateGame()

    game.printPlayers()
    game.endGame()
    del game


