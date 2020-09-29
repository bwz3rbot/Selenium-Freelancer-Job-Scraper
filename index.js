const {
    Builder,
    By,
    Key,
    until,
    WebElement
} = require('selenium-webdriver');
const {
    Parser
} = require('json2csv');
const fs = require('fs');

// JSON2csv setup
const fields = ['heading', 'daysLeft', 'verified', 'price', 'numBids', 'description', 'skills','link'];
const opts = {
    fields
}
const rows = [];

// Start Browser
const driver = new Builder().forBrowser("firefox").build();

// Run App
let continueLooping = true;
async function run(query, limit) {

    console.log(`searching freelancer.com/jobs for ${query}...`)
    await search(query);
    const totalResults = await driver.findElement(By.css('span[id="total-results"]')).getText();
    const removedCommas = totalResults.replace(/,/g, '')
    const total = parseInt(removedCommas);
    console.log("total results: ", total)
    const maxLimit = Math.floor(total / 50);
    console.log("Max number of pages allowed for this search query: ", maxLimit)

    let count = 0;
    do {
        console.log(`Building job cards for page ${count+1}...`)
        await buildJobCardsForPage();
        console.log("Clicking next page button...")
        await clickNextPageButton(continueLooping);

        if (count == maxLimit) {
            console.log("max limit reached")
            continueLooping = false;
        }
        if (count == limit) {
            const msg = parseInt(limit) + 1;
            console.log(`Generated ${msg} page(s) of results.`)
            continueLooping = false;
        }
        count++;
    } while (continueLooping == true);

    // Parse to CSV file with name of query
    console.log(`saving file "./${query}.csv"`);
    parseToCsv(query);

}

// Navigate to freelancer.com/jobs and submit a search for 'query'
async function search(query) {
    // Get Freelancer Jobs search page
    console.log("navigating to freelancer.com/jobs...")
    await driver.get("https://freelancer.com/jobs/");

    // Submit query
    let searchInput = await driver.findElement(By.css('input[name="search_keyword"]'));
    await searchInput.sendKeys(query)
    await searchInput.sendKeys(Key.RETURN);
    await driver.wait(until.urlContains(query))
}

// Get the job cards on the current page
async function buildJobCardsForPage() {

    // Make a list of JobSearchCards
    await driver.wait(until.elementLocated(By.css('div[class="JobSearchCard-item "]')));
    const JobCards = await driver.findElements(By.css('div[class="JobSearchCard-item "]'));

    for (const jobCard of JobCards) {
        const card = await buildJobCard(jobCard)
        rows.push(card)
    }
}

// Build an individual job card
async function buildJobCard(jobCard) {

    const href = await jobCard.findElement(By.css('a[class="JobSearchCard-primary-heading-link"]')).getAttribute('href');

    // Check for contests/secret projects, skip over
    if (!href.includes('/login?')) {
        const heading = await jobCard.findElement(By.css('a[class="JobSearchCard-primary-heading-link"]')).getText();
        const daysLeft = await jobCard.findElement(By.css('span[class="JobSearchCard-primary-heading-days"]')).getText();
        let verified;
        try {
            verified = await jobCard.findElement(By.css('div[data-tooltip="This user has verified their Payment method"]')).getText();
        } catch (err) {
            if (err)
                verified = "NOT VERIFIED."
        }
        const price = await jobCard.findElement(By.css('div[class="JobSearchCard-secondary-price"]')).getText();
        const numBids = await jobCard.findElement(By.css('div[class="JobSearchCard-secondary-entry"]')).getText();
        const description = await jobCard.findElement(By.css('p[class="JobSearchCard-primary-description"]')).getText();
        const skills = await jobCard.findElements(By.css('a[class="JobSearchCard-primary-tagsLink"]'));
        const skillsList = []
        for await (const skill of skills) {
            const skillText = await skill.getText();
            skillsList.push(skillText);
        }
        const link = await jobCard.findElement(By.css('a[class="JobSearchCard-primary-heading-link"]')).getAttribute('href');
        const card = {
            href,
            heading,
            daysLeft,
            verified,
            price,
            numBids,
            description,
            skills: skillsList,
            link
        }
        return card;
    }

}

// Wait for next page of results to load
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Click next page button
async function clickNextPageButton(continueLooping) {
    let li = await driver.findElement(By.css('li[data-link="next_page"]'))
    let next = await li.findElement(By.css('a[class="btn Pagination-link"]'));
    await next.click();
    console.log("politely waiting...")
    await timeout(5000);
}

// Parse to csv and save to file
const parseToCsv = function (query) {
    try {
        const parser = new Parser(opts);
        const csv = parser.parse(rows)
        fs.writeFileSync(`./${query}.csv`, csv, "utf-8")
    } catch (err) {
        console.log(err)
    }
}


// First command line argument: query param
const query = process.argv[2] || "selenium";
// Second command line argument: number of pages of results
const limit = process.argv[3] || 6;
// Run App with args
run(query, limit);