var xhttp = new XMLHttpRequest();

var data = [];
var json = {};
var cursor = null;
var self = this;

requestData(cursor);

function concatResults(response){
    let json = JSON.parse(response);
    cursor = json.data.search.pageInfo.endCursor;
    let array = json2array(json['data']['search']['edges']);
    data = data.concat(array);
}

function requestData(cursor){
    var http = new XMLHttpRequest();
    var url = 'https://api.github.com/graphql';
    var after = '';
    
    if(cursor) after = `, after:"${cursor}"`;
    
    http.open('POST', url, true);
    var params = JSON.stringify({
                    query : `query example { search(query:"stars:>100", first:10, type:REPOSITORY ${after}){ pageInfo{ hasNextPage endCursor } edges{ node{ ... on Repository{ name createdAt updatedAt pullRequests(states:MERGED){ totalCount } releases{ totalCount } primaryLanguage { name } issues{ totalCount } closedIssues : issues(states:CLOSED){ totalCount } } } } } }`
                 });
    
    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', 'application/JSON');
    http.setRequestHeader('Authorization', 'bearer c412b3b9643c731774b679b0e3f51016e7e34d43');
    
    http.onreadystatechange = function() {//Call a function when the state changes.
        if(http.readyState == 4 && http.status == 200) {
            concatResults(http.responseText);
            if(self.data.length <= 1000)requestData(self.cursor);
            if(self.data.length == 1000){
              console.log(JSON.stringify(self.data));
              download("data.txt", JSON.stringify(self.data));
            } 
        }
    }
    http.send(params);
}

function json2array(json){
    var result = [];
    var keys = Object.keys(json);
    keys.forEach(function(key){
        result.push(json[key]);
    });
    return result;
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data: application/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}