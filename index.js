const express=require("express");
const bodyParser = require("body-parser")
const https= require("https");
const path=require("path");

const app=express();

app.set('views', path.join(__dirname, 'views')); 
app.use(express.static(path.join(__dirname, "public"))); 

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

var viewData = [];
var globalCountryData = [];

function dataFetch(type, res){
    viewData = [];
    const countryUrl = "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies.json";
    const currencyUrl = "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/inr.json";
    https.get(countryUrl, function(response){
        let countryData = "";

        response.on("data", function(chunk) {
            countryData += chunk;
        });

        response.on("end", function() {
            const jsonCountryData = globalCountryData = JSON.parse(countryData);

            https.get(currencyUrl, (response) => {
                let currencyData = "";
        
                response.on("data", function(chunk) {
                    currencyData += chunk;
                });
        
                response.on("end", function() {
                    const jsonCurrencyData = JSON.parse(currencyData).inr;
                    
                    for (let currencyCode in jsonCountryData) {
                        if(jsonCountryData[currencyCode] && currencyCode && jsonCurrencyData[currencyCode]){
                            viewData.push({
                                currencyName:jsonCountryData[currencyCode],
                                currencyCode:currencyCode,
                                currencyVal:jsonCurrencyData[currencyCode]
                            });
                        }
                    }
                    if(type === 'view') {
                        res.render("view.ejs",{viewData:viewData});
                    } else if(type === 'convert') {
                        res.render("convert.ejs",{viewData:viewData,result:'',prevVal:0,alert:""});
                    }
                });
            });
        });
    });
};

app.get("/convert",function(req,res){
    dataFetch('convert', res);
});

app.post("/convert",function(req,res){
    const from=req.body.from;
    const fromVal=req.body.fromVal;
    const to=req.body.to;
    if(from && fromVal && to){
        const url = "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/"+from+"/"+to+".json";
        https.get(url,function(response){
        let data="";
        response.on("data",function(chunks){
            data+=chunks;
        });

        response.on("end",function(){
            const val=JSON.parse(data);
            const result = fromVal + ' ' + globalCountryData[from] + ' = ' + (val[to] * fromVal) + ' ' + globalCountryData[to];
            res.render("convert",{result:result,viewData:viewData,prevVal:fromVal,alert:""});
        });
    });
    }
    else{
        res.render("convert",{result:'',viewData:viewData,prevVal:fromVal,alert:"Enter all fields"});
    }
    
});

app.get("/view", function(req, res) {
    dataFetch('view', res);
});

app.get("/",function(req,res){
    res.render("home.ejs");
});


app.listen(3000,function(){
    console.log("Server is running on port 3000");
});