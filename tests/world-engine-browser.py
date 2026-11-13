import os,time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
worlds='roadtohistory halloffamers kickoff sensiblesocceracademy subbuteosuperleague worldleague masterleagueworld scudetto'.split()
options=webdriver.ChromeOptions()
options.page_load_strategy="eager"
options.add_argument('--headless=new')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--window-size=430,932')
with webdriver.Chrome(options=options) as driver:
    driver.set_page_load_timeout(90)
    wait=WebDriverWait(driver,60)
    for world in worlds:
        driver.get('https://www.italianmastersclub.it/'+world+'/competitions/?engine=browser')
        wait.until(lambda d:d.find_elements(By.CSS_SELECTOR,'[data-key]'))
        first=driver.find_elements(By.CSS_SELECTOR,'[data-key]')[0]
        driver.execute_script("arguments[0].scrollIntoView({block:'center',behavior:'instant'})",first)
        wait.until(lambda d:d.execute_script("const r=arguments[0].getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return hit && arguments[0].contains(hit)",first))
        first.click()
        wait.until(lambda d:d.find_elements(By.CSS_SELECTOR,'.cup-tabs [data-main-tab]'))
        labels=[e.text for e in driver.find_elements(By.CSS_SELECTOR,'.cup-tabs [data-main-tab]')]
        assert labels==['Last Round','Schedule','Standings','Stats'],(world,labels)
        wait.until(lambda d:d.find_element(By.ID,'cup-view').get_attribute('aria-busy')=='false')
        assert not driver.find_elements(By.CSS_SELECTOR,'.cup-summary'),world
        assert 'temporaneamente non disponibili' not in driver.find_element(By.ID,'cup-view').text,world
        driver.find_element(By.CSS_SELECTOR,'[data-main-tab="matches"]').click()
        wait.until(lambda d:d.find_element(By.CSS_SELECTOR,'[data-main-tab="matches"]').get_attribute('aria-pressed')=='true')
        assert not driver.find_elements(By.CSS_SELECTOR,'[data-mode]'),world
        assert driver.current_url.startswith('https://www.italianmastersclub.it/'+world+'/'),world
        print(world,'normal competition entry verified',flush=True)
