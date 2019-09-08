var xhttp = new XMLHttpRequest();

var data = [];
var cursor = null;
var self = this;
var today =  new Date();
var popLanguages = ['JavaScript', 'Java', 'Python', 'C#', 'PHP', 'C++', 'C', 'TypeScript', 'Ruby', 'Swift'];

//-------------------Request dos dados--------------------
requestData(cursor);

function concatResults(response){
    let json = JSON.parse(response);
    cursor = json.data.search.pageInfo.endCursor;
    let array = json2array(json['data']['search']['edges']);
    data = data.concat(array);
}

function requestData(cursor){
    let http = new XMLHttpRequest();
    let url = 'https://api.github.com/graphql';
    let after = '';
    
    if(cursor) after = `, after:"${cursor}"`;
    
    http.open('POST', url, true);
    let params = JSON.stringify({
                    query : `query example { search(query:"stars:>100", first:10, type:REPOSITORY ${after}){ pageInfo{ hasNextPage endCursor } edges{ node{ ... on Repository{ name createdAt updatedAt pullRequests(states:MERGED){ totalCount } releases{ totalCount } primaryLanguage { name } issues{ totalCount } closedIssues : issues(states:CLOSED){ totalCount } } } } } }`
                 });
    
    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', 'application/JSON');
    http.setRequestHeader('Authorization', 'bearer 82c610f7d755ff854ef44f958a61e313e2fdb5fe');
    
    http.onreadystatechange = function() {//Call a function when the state changes.
        if(http.readyState == 4 && http.status == 200) {
            concatResults(http.responseText);
            if(self.data.length <= 1000)requestData(self.cursor);
            if(self.data.length == 1000){
              //console.log(JSON.stringify(self.data));
              download("data.txt", JSON.stringify(self.data));
              self.calculateResults(false);
              self.calculateResults(true); // agrupa por linguagem
            } 
        }
    }
    http.send(params);
}

function json2array(json){
    let result = [];
    let keys = Object.keys(json);
    keys.forEach(function(key){
        json[key].node.age = diffDates(new Date(json[key].node.createdAt), self.today);
        json[key].node.daysLastUpdate = diffDates(new Date(json[key].node.updatedAt), self.today);
        json[key].node.daysLastUpdate = diffDates(new Date(json[key].node.updatedAt), self.today);
        json[key].node.percentIssues = percent(json[key].node.closedIssues.totalCount, json[key].node.issues.totalCount);
        result.push(json[key]);
    });
    return result;
}

function download(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data: application/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function formatDate(date){
    let year = date.substr(0,4);
    let month = date.substr(5, 2);
    let day = date.substr(8, 2);
    return `${day}/${month}/${year}`
}

function diffDates(date1, date2) {
    let _MS_PER_DAY = 1000 * 60 * 60 * 24;
    let utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    let utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  
    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function percent(val1, val2){
    return isNaN(val1 / val2)? 1 : (val1 / val2); 
}
//-------------------Tratamento dos dados para o relatorio--------------------

function calculateResults(langGroup){
    if(langGroup){
        console.log(`----Por Linguagem----`);
        popLanguages.forEach(lang => {
            let avgAge = averageGroup("age", false, lang);
            let avgPull = averageGroup("pullRequests", true, lang);
            let avgRelease = averageGroup("releases", true, lang);
            let avgLastUpdate = averageGroup("daysLastUpdate", false, lang);
            let avgPercentIssues = averageGroup("percentIssues", false, lang);
            console.log(`Language: ${lang} Age: ${avgAge} PullRequests: ${avgPull} Releases: ${avgRelease} LastUpdate: ${avgLastUpdate} PercentIssues: ${avgPercentIssues}`);
        });
    }else {
        let avgAge = average("age", false);
        let avgPull = average("pullRequests", true);
        let avgRelease = average("releases", true);
        let avgLastUpdate = average("daysLastUpdate", false);
        let avgPercentIssues = average("percentIssues", false);
        let avgLanguages = averageLanguages();
        console.log(`----Geral----`);
        console.log(`Age: ${avgAge} PullRequests: ${avgPull} Releases: ${avgRelease} LastUpdate: ${avgLastUpdate} PercentIssues: ${avgPercentIssues} PopularLanguagesPercent: ${avgLanguages}`);
    }
}

function average(type, hasCount){
    let sum = 0;
    let qtd = data.length;
    data.forEach(element => {
        if(hasCount) sum += element.node[type].totalCount
        else sum += element.node[type]
    });
    return sum/qtd;
}

function averageGroup(type, hasCount, language){
    let sum = 0;
    let qtd = 0;
    data.forEach(element => {
        if(language && element.node.primaryLanguage != null && element.node.primaryLanguage.name == language){
            if(hasCount) sum += element.node[type].totalCount
            else sum += element.node[type]
            qtd++;
        } 
    });
    return sum/qtd;
}

function averageLanguages(){
    let sum = 0;
    let qtd = data.length;

    data.forEach(element => {
        if(element.node.primaryLanguage != null){
            let name = element.node.primaryLanguage.name;
            popLanguages.forEach(element =>{
                if(name == element) sum++;
            });
        }
    });
    return sum/qtd;
}

