const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const readline = require('readline');


function fetchPageData(page, book){
    return new Promise(async (resolve, reject) => {
        let url = `https://www.bokus.com/cgi-bin/product_search.cgi?is_paginate=1&search_word=${book}&from=${page}`;

        let response = await axios.request({
            method: 'GET',
            url,
            responseType: 'arraybuffer',
            responseEncoding: 'binary'
        });

        const $ = cheerio.load(iconv.decode(response.data, 'ISO-8859-1'));
        let books = [];
        $('.ProductList .Item').each(function (i, elem) {
            $(elem).find('.Item__format-as-link').remove();
            let price = $(elem).find('.pricing').text().trim();
            let title = $(elem).find('.Item__title').text().trim();
            let link = `https://www.bokus.com${$(elem).find('.Item__title a').attr('href').trim()}`;
            let format = $(elem).find('.Item__format').text().trim();
    
            books.push({title, price, format, page, link});
        });

        resolve(books);
       });
}

async function  getData(book){
    let url = `https://www.bokus.com/cgi-bin/product_search.cgi?ac_used=no&search_word=${book}`;

    let response = await axios.request({
        method: 'GET',
        url,
        responseType: 'arraybuffer',
        responseEncoding: 'binary'
    });

   const init$ = cheerio.load(iconv.decode(response.data, 'ISO-8859-1'));

   let pages = parseInt(init$('.Pagination__page').last().text());

   let promises = [];

   for(let i = 1; i <= pages; i++){
    promises.push(fetchPageData(i, book));
   }

   function compareByPrice(a, b) {
    return a.price - b.price;
  }

   Promise.all(promises).then((data) => {

    let newdata = data.flat();
    let sortedBooks = newdata.sort(compareByPrice);

    function getCheapest(sortedBooks){
        let cheapestBooks = {};
        let rv = [];
        for(let i = 0; i < sortedBooks.length; i++){
            if(sortedBooks[i].format && !(sortedBooks[i].format in cheapestBooks)){
                if(sortedBooks[i].price){
                    rv.push(sortedBooks[i]);
                    cheapestBooks[sortedBooks[i].format] = true;
                }
            }
        }
        console.log(cheapestBooks);
            return rv;
    }
        console.log(getCheapest(sortedBooks));
    });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question("what book do you want to search for? \n", function (answer) {
    let book = (answer.replace(' ', '%20'));
    getData(book);
});




