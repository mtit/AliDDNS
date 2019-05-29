/**
 * 这是IPv6专用版 O(∩_∩)O
 */
const https = require('https');
const Core = require('@alicloud/pop-core');
const schedule = require('node-schedule');

/**
 * 这里应通过云解析SDK获取当前的解析地址，
 * 但是因为我这IP基本一天变一次，所以随便写个无所谓了 /(ㄒoㄒ)/~~
 */
const currentip = "2409:8a30:6a1d:d6a0:11ef:54e5:f000:764c";

/**
 * 配置云解析SDK
 */
const client = new Core({
  accessKeyId: '阿里云的accessKeyId',
  accessKeySecret: '阿里云的accessKeySecret',
  endpoint: 'https://alidns.aliyuncs.com',
  apiVersion: '2015-01-09'
});

/**
 * 获取域名所有解析记录，可用来做对比。最重要的是用来获取你要更新的解析记录的RecordId。
 */
function GetDesc(){
    client.request('DescribeDomainRecords',{"DomainName": "mtit.net"}, {method: 'POST'}).then((result) => {
        console.log(result.DomainRecords.Record);
      }, (ex) => {
        console.log(ex);
      });
}

/**
 * 更新解析记录到阿里云
 * @param {string} value 要解析到的新地址
 */
function Update(value){
    var params = {
      "RR": "api",
      "Type": "AAAA",//IPV6解析类型是AAAA。
      "Value": value,
      "RecordId": ""//通过GetDesc函数获取到的需要修改的记录的RecordId。
    }
    
    var requestOption = {
      method: 'POST'
    };
    client.request('UpdateDomainRecord', params, requestOption).then((result) => {
        console.log(result);
      }, (ex) => {
        console.log(ex);
      });
}

/**
 * 这里使用jsonip.com来获取本机的IP地址，
 * 但是如果直接使用jsonip.com访问则有可能获取到的是ipv4地址，在移动大内网下，毫无意义。
 * 所以自行构造访问头，强制使用ipv6访问。
 */
function GetIP(){

    const reqopts={
        hostname: "2600:3c01::f03c:91ff:fe79:43b",
        path: '/',
        port: 443,
        protocol: 'https:',
        headers: { host: 'jsonip.com' }
    };

    https.get(reqopts, (res)=>{  
        var html=''; 
        res.on('data',(data)=>{
            html+=data;  		
        }); 
        res.on('end',()=>{
            var jsonip = JSON.parse(html);
            if(jsonip.ip == currentip){
                console.log('无需更新解析记录')
            }else{
                console.log("==========IP地址已更改，进行更新解析操作==========");
                currentip = jsonip.ip;
                Update(jsonip.ip);
            }
        });  

    }).on('error',(e)=>{
        console.log(e);
    });
}
/**
 * 首次运行的时候执行一次更新。
 */
GetIP();

/**
 * 定时所有整点45分时执行一次更新。
 */
var rule = new schedule.RecurrenceRule();
rule.minute = 45;
schedule.scheduleJob(rule,()=>{
    console.log("\n\n\n==========开始检测IP变动==========");
    GetIP();
});