const useragent = require('express-useragent');
const mongoose = require('mongoose');
const Visitors = require('../models/visitor');

module.exports = (req) => {
    let { sessionID, method, ip, url, headers } = req;
    if (ip.substr(0, 7) == "::ffff:")
        ip = ip.substr(7);

    let ua = useragent.parse(headers['user-agent']);
    let device = getDevice(ua);
    let userData = {
        sessionId: sessionID,
        url: url, 
        method: method,
        ip: ip,
        device: device,
        browser: ua.browser, 
        os: ua.os, 
        platform: ua.platform
    };
    // check if there's already a record with this sess id 
    Visitors.countDocuments({sessionId: sessionID}, (err, count) => { 
        if(count>0){
            console.log('document exists')
        }else{
            Visitors.create(userData, (err, result) => {
                if (err) console.log(err);
                console.log('document created')
            });
        };
    }); 
    return;
};

const getDevice = (ua) => {
    switch (true) 
    {
        case ua.isMobile:       return 'Mobile';
        case ua.isTablet:       return 'Tablet';
        case ua.isDesktop:      return 'Desktop';
        case ua.isSmartTV:      return 'Smart TV';
        case ua.isKindleFire:   return 'Kindle';
        case ua.isBot:          return 'Bot'
        default:                return "Unknown";
    }
};