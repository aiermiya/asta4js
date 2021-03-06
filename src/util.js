"use strict";

var constant = require("./constant")
var config = require('./config');

var util = {};
var $ = config.$;

util.sync = function(){
  Platform.performMicrotaskCheckpoint();
};

util.determineRefPath = function (scope, varRef, searchKey) {
  var deleteSearchKey;
  if(searchKey){
    deleteSearchKey = false;
  }else{
    deleteSearchKey = true;
    searchKey = constant.impossibleSearchKey;
    varRef[searchKey] = 1;
  }

  var refPath = null;
  for (var p in scope) {
    var ref = scope[p];
    if (ref[searchKey]) {
      refPath = p;
      break;
    }
  }
  
  if(deleteSearchKey){
    delete varRef[searchKey];
  }

  return refPath;
};

var __uidTimestamp = Date.now();
var __uidSeq = 0;
util.createUID = function () {
  if(__uidSeq >= 1000000){
    __uidTimestamp = Date.now();
    __uidSeq = 0;
  }
  __uidSeq++;
  return "aj-" + __uidSeq + "-"+ __uidTimestamp;
};

//TODO we should keep ref always
util.regulateArray = function (v, tryKeepRef) {
  if (Array.isArray(v)) {
    if(tryKeepRef){
      return v;
    }else{
      return [].concat(v);
    }
  } else if (v === null || v === undefined) {
    return new Array();
  } else {
    return [v];
  }
};

util.clone = require("../lib/clone");

util.isJQuery = function(obj){
  if(obj){
    if($){
      return obj instanceof $
          || obj.constructor == $
          || Boolean(obj.jquery);
    }else{
      return Boolean(obj.jquery);
    }
  }else{
    return false;
  }
}

/**
 * (from)
 * (from, [propList])
 * (from, to)
 * (from, to, [propList])
 */
util.shallowCopy = function(arg1, arg2, arg3){
  var from = arg1;
  var to;
  var props;
  if(Array.isArray(arg2)){
    to = {};
    props = arg2;
  }else{
    to = arg2;
    props = arg3;
  }
  if(!to){
    to = {};
  }
  if(props){
    var p;
    for(var i=0;i<props.length;i++){
      p = props[i];
      to[p] = from[p];
    }
  }else{
    for(var p in from){
      to[p] = from[p];
    }
  }
  
  return to;
};

util.override = function(from, to){
  var ret = to;
  if(from === undefined || from === null){
    //do nothing
  }else if (to === undefined || to === null){
    ret = util.clone(from);
  }else if(Array.isArray(from) && Array.isArray(to)){
    Array.prototype.push.apply(to, from);
  }else if (util.isPlainObject(from) && util.isPlainObject(to)){
    for(var p in from){
      to[p] = util.override(from[p], to[p]);
    }
  }else{
    throw "cannot override different type data from \n"
          + JSON.stringify(from) + "\n"
          + " to \n"
          + JSON.stringify(to) + "\n";
  }
  return ret;
}

/*
 * copied from jquery
 */
util.isPlainObject = function(obj){
    if ( !obj || obj.toString() !== "[object Object]" || obj.nodeType || obj.setInterval ) {
        return false;
    }
     
    if ( obj.constructor && !obj.hasOwnProperty("constructor") && !obj.constructor.prototype.hasOwnProperty("isPrototypeOf") ) {
        return false;
    }
     
    var key;
    for ( key in obj ) {}
 
    return key === undefined || obj.hasOwnProperty(key);
}

util.arraySwap = function (array, index1, index2) {
      var tmp = array[index1];
      array[index1] = array[index2];
      array[index2] = tmp;
};

util.arrayLengthAdjust = function (targetArray, hopeLength, initialNewFn, discardCutFn) {
  var existingLength = targetArray.length;
  if(initialNewFn){
    var newItem;
    for(var i=existingLength;i<hopeLength;i++){
      newItem = initialNewFn(i);
      targetArray[i] = newItem;
    }
  }else{
    for(var i=existingLength;i<hopeLength;i++){
      targetArray[i] = undefined;
    }
  }
  var removeCount = existingLength - hopeLength;
  if(removeCount > 0){
    if(discardCutFn){
      for(var i=hopeLength;i<existingLength;i++){
        discardCutFn(targetArray[i], i);
      }
    }
    targetArray.splice(hopeLength, removeCount);
  }
};
    
util.findWithRoot = function(rootElem, selector){
      if(selector === ":root"){
        return rootElem;
      }
      var result = rootElem.find(selector);
      if(result.length === 0){
        if(rootElem.is(selector)){
          return rootElem;
        }
      }
      return result;
};

util.delay=function(callback, timeout, delayMoreCycles){
  if(delayMoreCycles && delayMoreCycles > 0){
    setTimeout(function(){
      util.delay(callback, timeout, delayMoreCycles-1);
    }, 0);
    return;
  }else{
    setTimeout(function(){
      callback.apply();
      util.sync();
    }, timeout ? timeout : 0);
  }
}

module.exports = util;