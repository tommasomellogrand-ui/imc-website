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
        wait.until(lambda d:d.find_elements(By.CSS_SELECTOR,'.competition-banner'))
        assert driver.find_element(By.CSS_SELECTOR,'.competition-banner').get_attribute('aria-label'),world
        assert not driver.find_elements(By.CSS_SELECTOR,'main.cup-wrap > .cup-back, main.cup-wrap > h1, #cup-phase'),world
        wait.until(lambda d:d.find_elements(By.CSS_SELECTOR,'.cup-season-bar select'))
        wait.until(lambda d:d.find_elements(By.CSS_SELECTOR,'.cup-tabs [data-main-tab]'))
        labels=[e.text for e in driver.find_elements(By.CSS_SELECTOR,'.cup-tabs [data-main-tab]')]
        assert labels==['Results','Schedule','Standings','Stats'],(world,labels)
        wait.until(lambda d:d.find_element(By.ID,'cup-view').get_attribute('aria-busy')=='false')
        assert not driver.find_elements(By.CSS_SELECTOR,'.cup-summary'),world
        assert 'temporaneamente non disponibili' not in driver.find_element(By.ID,'cup-view').text,world
        driver.find_element(By.CSS_SELECTOR,'[data-main-tab="matches"]').click()
        wait.until(lambda d:d.find_element(By.CSS_SELECTOR,'[data-main-tab="matches"]').get_attribute('aria-pressed')=='true')
        assert not driver.find_elements(By.CSS_SELECTOR,'[data-mode]'),world
        assert driver.current_url.startswith('https://www.italianmastersclub.it/'+world+'/'),world
        print(world,'normal competition entry verified',flush=True)

        driver.get('https://www.italianmastersclub.it/'+world+'/home/?turns=verify')
        wait.until(lambda d:d.find_elements(By.CSS_SELECTOR,'.imc-home-turns article'))
        assert driver.find_elements(By.CSS_SELECTOR,'.imc-calendar-date'),world
        assert not driver.find_elements(By.CSS_SELECTOR,'.imc-competition-tabs'),world
        dates=[s.get_attribute('data-date') for s in driver.find_elements(By.CSS_SELECTOR,'.imc-calendar-day')]
        assert [d for d in dates if d]==sorted(d for d in dates if d),world
        assert driver.execute_script("return getComputedStyle(document.querySelector('.imc-turn-grid')).gridTemplateColumns.split(' ').length") == 3,world
        assert all(c.get_attribute('data-group') in ['DOMESTIC','INTERNATIONAL','IMC','NATIONS'] for c in driver.find_elements(By.CSS_SELECTOR,'.imc-home-turns article')),world
        driver.get('https://www.italianmastersclub.it/'+world+'/matchday/?turns=verify')
        wait.until(lambda d:d.find_elements(By.CSS_SELECTOR,'.md-group-heading'))
        assert 'turni giocati' in driver.find_element(By.ID,'match-content').text,world
        assert not driver.find_elements(By.CSS_SELECTOR,'.md-category-tabs'),world
        assert driver.find_elements(By.CSS_SELECTOR,'.md-category-label'),world
        print(world,'Calendar dates, three-column boxes and category headers verified',flush=True)
