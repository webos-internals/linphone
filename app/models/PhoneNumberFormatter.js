/* Copyright 2009 Palm, Inc.  All rights reserved. */

var AbstractState = Class.create({
	handleZero: function(formatter){
		return this.handleOther(formatter, "0");
	},
	
	handleOne: function(formatter){
		return this.handleOther(formatter, "1");
	},
	
	handleOther: function(formatter, character){
		formatter.appendToNumber(character);
		return this;
	},
	
	handleEnd: function(formatter){
		return formatter.endState;
	}
})

var StartState = Class.create(AbstractState, {
	handleZero: function(formatter) {
		formatter.appendToNumber("0");
		return formatter.zeroState;
	},
	
	handleOne: function(formatter){
		formatter.longDistance = true;
		formatter.prefix = "1";
		return formatter.collectNumberState;
	},
	
	handleOther: function(formatter, character){
		if (character == '+') {
			return formatter.plusState;
		}
		formatter.appendToNumber(character);
		return formatter.collectNumberState;
	},
})

var EndState = Class.create(AbstractState, {
	handleOther: function(formatter, character){
		return this;
	},
	
	handleEnd: function(formatter, character){
		return this;
	}
})

var ZeroState = Class.create(AbstractState, {
	handleOne: function(formatter){
		formatter.appendToNumber("1");
		return formatter.zeroOneState;
	},
	
	handleOther: function(formatter, character){
		//FIXME: why did we need this?
//		formatter.appendToNumber("0");
		formatter.appendToNumber(character);
		return formatter.collectNumberState;
	}
})

var ZeroOneState = Class.create(AbstractState, {
	handleEnd: function(formatter){
		//FIXME: why did we need this?
//		formatter.appendToNumber("01");
		return formatter.endState;
	},
	
	handleOne: function(formatter){
		formatter.appendToNumber("1");
//		formatter.number = "";
		formatter.international = true;
		return formatter.collectNumberState;
	},
	
	handleZero: function(formatter){
		formatter.appendToNumber("0");
		return formatter.collectNumberState;
	},
	
	handleOther: function(formatter, character){
		//FIXME: why did we need this?
//		formatter.appendToNumber("01");
		formatter.appendToNumber(character);
		return formatter.collectNumberState;
	}
})

var PlusState = Class.create(AbstractState, {
	handleEnd: function(formatter){
		formatter.appendToNumber("+");
		return formatter.endState;
	},
	
	handleOne: function(formatter){
		formatter.longDistance = true;
		formatter.prefix = "+1";
		return formatter.collectNumberState;
	},
	
	handleOther: function(formatter, character){
		formatter.international = true;
		formatter.prefix = "+";
		formatter.appendToNumber(character);
		return formatter.collectNumberState;
	}
})

var CollectNumberState = Class.create(AbstractState, {
	handleOther: function(formatter, character){
		formatter.appendToNumber(character);
		return this;
	}
})

var PhoneNumberFormatter = Class.create({	
	initialize: function(number) {
		this.inputNumber = number;
		this.number = "";
		this.prefix = "";
		this.international = false;
		this.longDistance = false;
		this.currentState = this.startState;
	},
	
	format: function() {
		// TODO workaround: disabled in non-NA locales
		if (this.disabled) {
			return this.inputNumber;
		}
		
		if (this.masked && this.inputNumber.length >= 10) {
			this.maskNumber();
		}
		
		var count = this.inputNumber.length;
		for (var i = 0; i < count; ++i) {
			var c = this.inputNumber.charAt(i);
			if (c == '0') {
				this.currentState = this.currentState.handleZero(this);
			} else if (c == '1') {
				this.currentState = this.currentState.handleOne(this);
			} else {
				this.currentState = this.currentState.handleOther(this, c);
			}
		}
		this.currentState.handleEnd(this);
		this.extractParts();
		return this.formatParts();
	},
	
	// masks out n-5...n-2 with '55501'
	maskNumber: function() {
		var len = this.inputNumber.length
		if (len >= 10) {
			this.inputNumber =  this.inputNumber.substring(0, len - 7) + "55501" + this.inputNumber.substring(len - 2)
		} 
	},
	
	appendToNumber: function(value) {
		this.number += value;
	},
	
	extractParts: function() {
		if (!this.international) {
			if (this.longDistance || this.number.length > 7) {
				this.areaCode = this.number.slice(0,3);
				this.exchange = this.number.slice(3, 6);
				this.numberPart = this.number.slice(6, 10);
			} else {
				this.areaCode = "";
				this.exchange = this.number.slice(0, 3);
				this.numberPart = this.number.slice(3, 7);
			}
		}
	},
	
	appendWithDelimeters: function(b, value, preDelim, postDelim){
		if (value && value.length > 0) {
			if (preDelim && (b.length > 0 || !preDelim ==" ")) {
				b = b + preDelim;				
			}
			b = b + value;
			if (postDelim) {
				b = b + postDelim;				
			}
		}
		return b;
	},
	
	formatParts: function() {
		var b = "";
		if (this.international) {
			if (this.prefix == "+") {
				b = this.appendWithDelimeters(b, this.prefix, null, null);
				b = this.appendWithDelimeters(b, this.number, null, null);
			} else {
				b = this.appendWithDelimeters(b, this.prefix, null, null);
				b = this.appendWithDelimeters(b, this.number, " ", null);
			}
		} else {
			if (this.number.length > 10) {
				b = b + this.prefix + this.number;
			} else {
				if (this.longDistance) {
					b = this.appendWithDelimeters(b, this.prefix, null, null);
					b = this.appendWithDelimeters(b, this.areaCode, " (", ") ");
				} else {
					b = this.appendWithDelimeters(b, this.areaCode, " (", ") ");
				}
				b = this.appendWithDelimeters(b, this.exchange, null, null);
				b = this.appendWithDelimeters(b, this.numberPart, "-", null);				
			}
		}
		return b;
	}
	
});

PhoneNumberFormatter.prototype.collectNumberState = new CollectNumberState;
PhoneNumberFormatter.prototype.endState = new EndState;
PhoneNumberFormatter.prototype.startState = new StartState;
PhoneNumberFormatter.prototype.plusState = new PlusState;
PhoneNumberFormatter.prototype.zeroState = new ZeroState;
PhoneNumberFormatter.prototype.zeroOneState = new ZeroOneState;

// TODO: until we implement other phone number formatters
// set to true in AppAssistant to disable when format region isn't North America  
PhoneNumberFormatter.prototype.disabled = false;

// set to true to mask the middle 5 digits of a > 10 phone number
PhoneNumberFormatter.prototype.masked = false;

function FormatPhoneNumber (number) {
    // return an empty string if passed something invalid
    if (!number || number.length == 0 || typeof number !== "string") {
	return "";
    } 
    
    switch (number) {
    case "":
    case "unknown":
    case "unknown caller":
	//			return Messages.unknownNumber.toString();
    case "blocked":
    case "blocked caller":
	//			return Messages.blockedNumber.toString();
	return "" + number;
	
    }
    
    var digits = '123456789';
    // don't format if '112' or it doesn't start with a digit -- instead stringify and return 
    if (number == "112" || digits.indexOf(number.charAt(0)) === -1)
	return "" + number;
    return new PhoneNumberFormatter(number).format();
}