const months = [
  undefined, //1-based months.. :/
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

//parse year|month|date numbers
const ymd = function(arr) {
  let obj = {};
  let units = ['year', 'month', 'date', 'hour', 'minute', 'second'];
  for(let i = 0; i < units.length; i += 1) {
    if (!arr[i] && arr[1] !== 0) {
      continue;
    }
    obj[units[i]] = parseInt(arr[i], 10);
    if (isNaN(obj[units[i]])) {
      delete obj[units[i]];
    }
  }
  //try for timezone,too ftw
  let last = arr[arr.length - 1] || '';
  if (last.toLowerCase() === 'z') {
    obj.tz = 'UTC';
  } else if (/[+-][0-9]+:[0-9]/.test(last)) {
    obj.tz = arr[6];
  }
  return obj;
};

//zero-pad a number
const pad = function(num) {
  if (num < 10) {
    return '0' + num;
  }
  return String(num);
};

const toText = function(date) {
  //eg '1995'
  let str = String(date.year) || '';
  if (date.month !== undefined && months.hasOwnProperty(date.month) === true) {
    if (date.date === undefined) {
      //January 1995
      str = `${months[date.month]} ${date.year}`;
    } else {
      //January 5, 1995
      str = `${months[date.month]} ${date.date}, ${date.year}`;
      //add times, if available
      if (date.hour !== undefined && date.minute !== undefined) {
        let time = `${pad(date.hour)}:${pad(date.minute)}`;
        if (date.second !== undefined) {
          time = time + ':' + pad(date.second);
        }
        str = time + ', ' + str;
      //add timezone, if there, at the end in brackets
      }
      if (date.tz) {
        str += ` (${date.tz})`;
      }
    }
  }
  return str;
};

const parsers = {

  //generic {{date|year|month|date}} template
  date: (tmpl, obj) => {
    let arr = tmpl.split('|');
    arr = arr.slice(1, 8);
    let date = ymd(arr);
    date.text = toText(date); //make the replacement string
    obj.dates = obj.dates || [];
    obj.dates.push(date);
    return date.text;
  },

  //support parsing of 'February 10, 1992'
  natural_date: (tmpl, obj) => {
    let arr = tmpl.split('|');
    let str = arr[1] || '';
    // - just a year
    let date = {};
    if (/^[0-9]{4}$/.test(arr[1])) {
      date.year = parseInt(arr[1], 10);
    } else {
      //parse the date, using the js date object (for now?)
      let txt = arr[1].replace(/[a-z]+\/[a-z]+/i);
      txt = txt.replace(/[0-9]+:[0-9]+(am|pm)?/i);
      let d = new Date(txt);
      if (isNaN(d.getTime()) === false) {
        date.year = d.getFullYear();
        date.month = d.getMonth() + 1;
        date.date = d.getDate();
      }
    }
    obj.dates = obj.dates || [];
    obj.dates.push(date);
    return str.trim();
  },

  //just grab the first value, and assume it's a year
  one_year: (tmpl, obj) => {
    let arr = tmpl.split('|');
    let str = arr[1] || '';
    let year = parseInt(str, 10);
    obj.dates = obj.dates || [];
    obj.dates.push({
      year: year
    });
    return str.trim();
  },

  //assume 'y|m|d' | 'y|m|d'
  two_dates: (tmpl, obj) => {
    let arr = tmpl.split('|');
    //'b' means show birth-date, otherwise show death-date
    if (arr[1] === 'B' || arr[1] === 'b') {
      let date = ymd(arr.slice(2, 5));
      obj.dates = obj.dates || [];
      obj.dates.push(date);
      return toText(date);
    }
    let date = ymd(arr.slice(5, 8));
    obj.dates = obj.dates || [];
    obj.dates.push(date);
    return toText(date);
  }
};
module.exports = parsers;
