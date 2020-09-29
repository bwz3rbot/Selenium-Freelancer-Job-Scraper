# Selenium-Freelancer-Job-Scraper

## About <a name = "about"></a>

This project uses webdriver to scrape Freelancer.com *niceley* for a job query, then saves it into a csv for easy viewing.


### Prerequisites

First be sure to have node installed on your machine.\
You'll also need a webdriver.\
I chose firefox.\
<a href="https://www.npmjs.com/package/selenium-webdriver">https://www.npmjs.com/package/selenium-webdriver</a>\
Be sure to set the executable as a path variable.


### Installing

Install the dependancies:
```
npm i
```

Run the code with your query param passed as a command line argument:
```
node index.js selenium
```
Number of pages can be passed as a second argument, with a default of 6:
```
node index.js selenium 2
```
At 50 results a page, 6 pages will yield up to 300 results.

The app will run and the scraped data will be saved as a csv file.\
The file name will be the same as your query.