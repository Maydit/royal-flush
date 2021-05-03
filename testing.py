import selenium
from seleniumwire import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.wait import WebDriverWait as wait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import requests
from bs4 import BeautifulSoup
import os 
import time
from pokereval.card import Card
from pokereval.hand_evaluator import HandEvaluator

globalRankTranslation = {'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14}
globalSuitTranslation = {'S':1,'H':2,'D':3,'C':4}
def interceptor(request):
    del request.headers['Referer']  # Delete the header first
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
        options.add_argument('user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36"')
        self.driver =webdriver.Chrome(ChromeDriverManager().install(), options=options)
        self.driver.request_interceptor = interceptor
        curURL=self.driver.current_url
        self.driver.get("http://localhost:3000")
        wait(self.driver,15).until(EC.url_changes(curURL))

        self.driver.maximize_window()
        try:
            self.register()
            self.login()
        except:
            #curURL=self.driver.current_url
            #self.driver.back()
            #wait(self.driver,15).until(EC.url_changes(curURL))
            #self.login()
            pass
    
    def login(self):
        curURL=self.driver.current_url
        self.driver.find_element_by_xpath('//a[@href="'+"login/login.html"+'"]').click()
        wait(self.driver,15).until(EC.url_changes(curURL))
        self.driver.find_element_by_id("email").send_keys(self.email)
        self.driver.find_element_by_id("pass1").send_keys(self.password)
        assert(self.driver.find_element_by_id("submit_reg").is_enabled())
        self.driver.find_element_by_id("submit_reg").click()
        for request in self.driver.requests:
            if request.response:
                print(
                    request.url,
                    request.response.status_code,
                    request.response.headers['Content-Type']
                )
        self.driver.wait_for_request(timeout=10)
        time.sleep(10)


    def register(self):
        self.driver.find_element_by_id("firstname").send_keys(self.firstName)
        self.driver.find_element_by_id("lastname").send_keys(self.lastName)
        self.driver.find_element_by_id("email").send_keys(self.email)
        self.driver.find_element_by_id("pass1").send_keys(self.password)
        self.driver.find_element_by_id("pass2").send_keys(self.password)
        assert(self.driver.find_element_by_id("submit_reg").is_enabled())
        self.driver.find_element_by_id("submit_reg").click()
    def logout(self):
        pass
    def createGame(self):
        self.driver.find_element_by_id("joinButton").click()
        time.sleep(2)
        self.gameCode=self.driver.find_element_by_id("codeElement").getText()
        self.gameCode=self.gameCode.split()[1]
        self.isHost=True
    def joinGame(self,gameCode):
        self.driver.find_element_by_class_name("form-control").send_keys(gameCode)
        self.driver.find_element_by_id("joinButton").click()
        time.sleep(2)
    def check(self):
        self.driver.find_element_by_class_name("btn btn-primary checkButton").click()
        logText=self.driver.find_element_by_id("gameLog").getText()
        logText=logText.split('\n')
        assert(logText[0] == '{} {} checked.'.format(self.firstName,self.lastName))
    def match(self):
        self.driver.find_element_by_class_name("btn btn-primary matchButton").click()
        logText=self.driver.find_element_by_id("gameLog").getText()
        logText=logText.split('\n')
        assert(logText[0] == '{} {} matched.'.format(self.firstName,self.lastName))
        
    def fold(self):
        self.driver.find_element_by_class_name("btn btn-primary foldButton").click()
        logText=self.driver.find_element_by_id("gameLog").getText()
        logText=logText.split('\n')
        assert(logText[0] == '{} {} folded.'.format(self.firstName,self.lastName))
    def raiseAmnt(self,amount):
        self.driver.find_element_by_class_name("numberInput").send_keys(str(amount))
        self.driver.find_element_by_class_name("btn btn-primary raiseButton").click()
        logText=self.driver.find_element_by_id("gameLog").getText()
        logText=logText.split('\n')
        assert(logText[0] == '{} {} raised {}.'.format(self.firstName,self.lastName,amount))
    def getHand(self):
        self.hand=self.driver.find_element_by_id("currentHand").getText()
        self.hand= self.hand.split()[1]
        self.hand=self.hand.split()
    def getBoard(self):
        self.cardsOnTable=self.driver.find_element_by_id("commCards").getText()
        if(len(self.cardsOnTable)>15):
            self.cardsOnTable= self.hand.split()[3]
            self.cardsOnTable=self.hand.split()
        else:
            self.cardsOnTable=[]

class Poker:
    def __init__(self,userArr):
        pass
    def checkSync(self):
        #check if every user sees the same board
        pass
    def checkWinner(self):
        #check who wins!
        pass
    def checkAllUsersInGame(self):
        pass



if __name__ == "__main__":
    andy= User("Andy","C","andy154544@gmail.com","1234")
    fred=User("Fred","L","fred124124@gmail.com","1234")
    jeff = User("Jeff","M","jeff1241224@gmail.com","1234")
    jinnthon = User("Jinny","H","Jin124124@f.com","1234")


    
