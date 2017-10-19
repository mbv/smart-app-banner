'use strict';

var extend = require('xtend/mutable');
var q = require('component-query');
var doc = require('get-doc');
var cookie = require('cookie-cutter');
var ua = require('ua-parser-js');

/* global navigator */
var root = doc && doc.documentElement;


var SmartBanner = function (options) {
	var agent = ua(navigator.userAgent);
	this.options = extend({}, {
		daysHidden: 15,
		daysReminder: 90,
		button: 'Open In App',
		url: '#',
		scale: 'auto',
		force: '', // put platform type ('ios', 'android', etc.) here for emulation

	}, options || {});

	if (this.options.force) {
		this.type = this.options.force;
	} else if (agent.os.name === 'Windows Phone' || agent.os.name === 'Windows Mobile') {
		this.type = 'windows';
	} else if (agent.os.name === 'iOS') {
		this.type = 'ios';
	} else if (agent.os.name === 'Android') {
		this.type = 'android';
	}

	// Don't show banner on ANY of the following conditions:
	// - device os is not supported,
	// - running on standalone mode
	// - user dismissed banner
	var unsupported = !this.type;

	var runningStandAlone = navigator.standalone;
	var userDismissed = cookie.get('smartbanner-closed');
	var userInstalled = cookie.get('smartbanner-installed');

	if (unsupported || runningStandAlone || userDismissed || userInstalled) {
		return;
	}

	this.create();
	this.show();
};

SmartBanner.prototype = {
	constructor: SmartBanner,

	create: function () {
		var sb = doc.createElement('div');

		var scale = this.options.scale === 'auto' ? window.innerWidth / window.screen.width : this.options.scale;
		if (scale < 1) {
			scale = 1;
		}

		sb.className = 'open-in-app-button';
		sb.innerHTML = '<span class="open-in-app-button-container">' +
      '<a class="open-in-app-button-link" href="' + this.options.url + '">' + this.options.button + '</a>' +
      '<a class="open-in-app-button-close" href="javascript:void(0);">&times;</a>' +
      '</span>';

		// there isn’t neccessary a body
		if (doc.body) {
			doc.body.appendChild(sb);
		}		else if (doc) {
			doc.addEventListener('DOMContentLoaded', function () {
				doc.body.appendChild(sb);
			});
		}

		this.resize()

		q('.open-in-app-button-link', sb).addEventListener('click', this.open.bind(this), false);
		q('.open-in-app-button-close', sb).addEventListener('click', this.close.bind(this), false);
		q('body').addEventListener('resize', this.resize.bind(this), false);
	},
  resize: function () {
    var scale = this.options.scale === 'auto' ? window.innerWidth / window.screen.width : this.options.scale;
    if (scale < 1) {
      scale = 1;
    }

    var container = q('.open-in-app-button-container')
    container.style.webkitTransform = 'translateX(-50%) scale(' + scale + ')';
    container.style.MozTransform = 'translateX(-50%) scale(' + scale + ')';
    container.style.msTransform = 'translateX(-50%) scale(' + scale + ')';
    container.style.OTransform = 'translateX(-50%) scale(' + scale + ')';
    container.style.transform = 'translateX(-50%) scale(' + scale + ')';

  },
	hide: function () {
		root.classList.remove('open-in-app-button-show');

		if (typeof this.options.close === 'function') {
			return this.options.close();
		}
	},
	show: function () {
		root.classList.add('open-in-app-button-show');
		if (typeof this.options.show === 'function') {
			return this.options.show();
		}
	},
	close: function () {
		this.hide();
		cookie.set('open-in-app-button-closed', 'true', {
			path: '/',
			expires: new Date(Number(new Date()) + (this.options.daysHidden * 1000 * 60 * 60 * 24))
		});
		if (typeof this.options.close === 'function') {
			return this.options.close();
		}
	},
	open: function () {
		this.hide();
		cookie.set('open-in-app-button-opened', 'true', {
			path: '/',
			expires: new Date(Number(new Date()) + (this.options.daysReminder * 1000 * 60 * 60 * 24))
		});
		if (typeof this.options.close === 'function') {
			return this.options.close();
		}
	}
};

module.exports = SmartBanner;
