"""
This is the testing script that should be used to validate that the game still works after making changes. 
The script does the following things 
1) creates 4 new accounts 
2) login with those accounts 
3) create a game and join the game 
4) play 5 rounds of the game 
5) logout of the game, and print the player info

too validate the statistics sare working properly, log into the accounts after the tests have finished running to check if the statistics are updated 
"""
import selenium
from seleniumwire import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.wait import WebDriverWait as wait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import random
import time

#will impliment result validation in the future using these global translation dictionaries 
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
        #create a new webdriver with a header 
        options = webdriver.ChromeOptions()
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        options.add_argument('--ignore-certificate-errors')
        options.add_argument('--incognito')
        #remove headless option if you want to see the program work live 
        #options.add_argument('--headless')
        options.add_argument('user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36"')
        self.driver =webdriver.Chrome(ChromeDriverManager().install(), options=options)
        #used to manage header requests 
        self.driver.request_interceptor = interceptor
        curURL=self.driver.current_url
        self.driver.get("http://localhost:3000")
        wait(self.driver,15).until(EC.url_changes(curURL))
        self.driver.maximize_window()
        self.register()
        self.login()
    
    #when on the main page, this function will log the account in
    def login(self):
        curURL=self.driver.current_url
        self.driver.find_element_by_xpath('//a[@href="'+"login/login.html"+'"]').click()
        wait(self.driver,15).until(EC.url_changes(curURL))
        self.driver.find_element_by_id("email").send_keys(self.email)
        self.driver.find_element_by_id("pass1").send_keys(self.password)
        assert(self.driver.find_element_by_id("submit_reg").is_enabled())
        self.driver.find_element_by_id("submit_reg").click()

    #from the main page register the account
    def register(self):
        self.driver.find_element_by_id("firstname").send_keys(self.firstName)
        self.driver.find_element_by_id("lastname").send_keys(self.lastName)
        self.driver.find_element_by_id("email").send_keys(self.email)
        self.driver.find_element_by_id("pass1").send_keys(self.password)
        self.driver.find_element_by_id("pass2").send_keys(self.password)
        assert(self.driver.find_element_by_id("submit_reg").is_enabled())
        self.driver.find_element_by_id("submit_reg").click()

    #logout the account and close the website
    def logout(self):
        self.driver.find_element_by_id("logoutButton").click()
        self.driver.quit()

    #create a default game 
    def createGame(self):
        self.driver.find_element_by_id("joinButton").click()
        time.sleep(2)
        self.gameCode=self.driver.find_element_by_id("codeElement").text
        self.gameCode=self.gameCode.split()[1]
        self.isHost=True

    #join a game with a specific code ***note in the current version joinGame functions like createGame but with an assigned code 
    def joinGame(self,gameCode=random.randint(1000,5000)):
        self.driver.find_element_by_class_name("form-control").send_keys(gameCode)
        self.driver.find_element_by_id("joinButton").click()
        self.gameCode=gameCode
        time.sleep(2)

    #simulate player Checks 
    def check(self):
        self.driver.find_element_by_xpath('//button[text()="Check"]').click()

    #simulate player matches a raise
    def match(self):
        self.driver.find_element_by_xpath('//button[text()="Match"]').click()

    #simulate player folds 
    def fold(self):
        self.driver.find_element_by_xpath('//button[text()="Fold"]').click()

    #simulate player raises
    def raiseAmnt(self,amount):
        self.driver.find_element_by_class_name("numberInput").send_keys(str(amount))
        self.driver.find_element_by_xpath('//button[text()="Raise"]').click()
        self.driver.find_element_by_class_name("numberInput").clear()

    #get players current hand 
    def getHand(self):
        self.hand=self.driver.find_element_by_id("currentHand").text
        self.hand= self.hand.split()[1]
        self.hand=self.hand.split()

    #get the current log 
    def getLog(self):
        logText=self.driver.find_element_by_id("gameLog").text
        logText=logText.split('\n')
        return logText
    
    #get who's turn it is 
    def getAction(self):
        action=self.driver.find_element_by_id("action").text
        action=action.split()
        if action[-1]=="N/A":
            return["N/A"]
        else:
            return [action[2],action[3]]
    
    #get the cards on the board
    def getBoard(self):
        self.cardsOnTable=self.driver.find_element_by_id("commCards").text
        if(len(self.cardsOnTable)>15):
            self.cardsOnTable= self.hand.split()[3]
            self.cardsOnTable=self.hand.split()
        else:
            self.cardsOnTable=[]
        return self.cardsOnTable

    #get players current balance 
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
    
    #print players login info 
    def printLoginInfo(self):
        print("Username: {}\nPassword:{}".format(self.email,self.password))

class Poker:
    def __init__(self,userArr):
        self.players=userArr

    #check if every user sees the same board
    def checkSync(self):
        hostBoard = self.players[0].getBoard()
        for player in self.players:
            if hostBoard != player.getBoard():
                return False 
        return True

    #see if the game ended 
    def checkWinner(self):
        for player in self.players:
            if len(player.getLog())>1:
                if player.getLog()[1] =="{} {} won the hand!".format(player.firstName,player.lastName):
                    return True
        return False

    #will default to pick a random action, otherwise choose an action to execute
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

    #find a random valid action
    def chooseValidAction(self,player):
        invalidMoves=["Not your turn!", "Can't Check!", "Can't Match!","Raise amount must be greater than last raise"]
        self.chooseAction(player)
        while player.getLog()[0] in invalidMoves:
            self.chooseAction(player)

    #simulate a singular game
    def simulateGame(self):
        #everyone checks at first 
        for player in self.players:
            player.check()

        while not self.checkWinner() and self.checkSync():
            for player in self.players:
                if player.getAction() == [player.firstName,player.lastName]:
                    self.chooseValidAction(player)

    #print all info of players in game 
    def printPlayers(self):
        for i in range(len(self.players)):
            print("Player {} info".format(i))
            self.players[i].printLoginInfo()

    #end game for all players 
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


