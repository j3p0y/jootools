jQuery.extend(jQuery,{
	chk: function(obj){ return !!(obj || obj === 0); },
	time: function(){ return +new Date; },
	escapeRegExp: function(s){ return s.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1'); },
	xmlData: function(v) { return (v?(v['#cdata']?v['#cdata']:(v['#text']?v['#text']:v)):''); },
	parseXml: function(xml) {
	   var dom = null;
	   if (window.DOMParser) {
		  try { 
			 dom = (new DOMParser()).parseFromString(xml, "text/xml"); 
		  } 
		  catch (e) { dom = null; }
	   }
	   else if (window.ActiveXObject) {
		  try {
			 dom = new ActiveXObject('Microsoft.XMLDOM');
			 dom.async = false;
			 if (!dom.loadXML(xml)) // parse error ..
	
				window.alert(dom.parseError.reason + dom.parseError.srcText);
		  } 
		  catch (e) { dom = null; }
	   }
	   else
		  alert("cannot parse xml string!");
	   return dom;
	},
	xml2json: function(xml, tab) {
	   var X = {
		  toObj: function(xml) {
			 var o = {};
			 if (xml.nodeType==1) {   // element node ..
				if (xml.attributes.length)   // element with attributes  ..
				   for (var i=0; i<xml.attributes.length; i++)
					  o["@"+xml.attributes[i].nodeName] =  X.escape((xml.attributes[i].nodeValue||"").toString());
				if (xml.firstChild) { // element has child nodes ..
				   var textChild=0, cdataChild=0, hasElementChild=false;
				   for (var n=xml.firstChild; n; n=n.nextSibling) {
					  if (n.nodeType==1) hasElementChild = true;
					  else if (n.nodeType==3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++; // non-whitespace text
					  else if (n.nodeType==4) cdataChild++; // cdata section node
				   }
				   if (hasElementChild) {
					  if (textChild < 2 && cdataChild < 2) { // structured element with evtl. a single text or/and cdata node ..
						 X.removeWhite(xml);
						 for (var n=xml.firstChild; n; n=n.nextSibling) {
							if (n.nodeType == 3)  // text node
							   o["#text"] = X.escape(n.nodeValue);
							else if (n.nodeType == 4)  // cdata node
							   o["#cdata"] = X.escape(n.nodeValue);
							else if (o[n.nodeName]) {  // multiple occurence of element ..
							   if (o[n.nodeName] instanceof Array)
								  o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
							   else
								  o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
							}
							else  // first occurence of element..
							   o[n.nodeName] = X.toObj(n);
						 }
					  }
					  else { // mixed content
						 if (!xml.attributes.length)
							o = X.escape(X.innerXml(xml));
						 else
							o["#text"] = X.escape(X.innerXml(xml));
					  }
				   }
				   else if (textChild) { // pure text
					  if (!xml.attributes.length)
						 o = X.escape(X.innerXml(xml));
					  else
						 o["#text"] = X.escape(X.innerXml(xml));
				   }
				   else if (cdataChild) { // cdata
					  if (cdataChild > 1)
						 o = X.escape(X.innerXml(xml));
					  else
						 for (var n=xml.firstChild; n; n=n.nextSibling)
							o["#cdata"] = X.escape(n.nodeValue);
				   }
				}
				if (!xml.attributes.length && !xml.firstChild) o = null;
			 }
			 else if (xml.nodeType==9) { // document.node
				o = X.toObj(xml.documentElement);
			 }
			 else
				alert("unhandled node type: " + xml.nodeType);
			 return o;
		  },
		  toJson: function(o, name, ind) {
			 var json = name ? ("\""+name+"\"") : "";
			 if (o instanceof Array) {
				for (var i=0,n=o.length; i<n; i++)
				   o[i] = X.toJson(o[i], "", ind+"\t");
				json += (name?":[":"[") + (o.length > 1 ? ("\n"+ind+"\t"+o.join(",\n"+ind+"\t")+"\n"+ind) : o.join("")) + "]";
			 }
			 else if (o == null)
				json += (name&&":") + "null";
			 else if (typeof(o) == "object") {
				var arr = [];
				for (var m in o)
				   arr[arr.length] = X.toJson(o[m], m, ind+"\t");
				json += (name?":{":"{") + (arr.length > 1 ? ("\n"+ind+"\t"+arr.join(",\n"+ind+"\t")+"\n"+ind) : arr.join("")) + "}";
			 }
			 else if (typeof(o) == "string")
				json += (name&&":") + "\"" + o.toString() + "\"";
			 else
				json += (name&&":") + o.toString();
			 return json;
		  },
		  innerXml: function(node) {
			 var s = ""
			 if ("innerHTML" in node)
				s = node.innerHTML;
			 else {
				var asXml = function(n) {
				   var s = "";
				   if (n.nodeType == 1) {
					  s += "<" + n.nodeName;
					  for (var i=0; i<n.attributes.length;i++)
						 s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue||"").toString() + "\"";
					  if (n.firstChild) {
						 s += ">";
						 for (var c=n.firstChild; c; c=c.nextSibling)
							s += asXml(c);
						 s += "</"+n.nodeName+">";
					  }
					  else
						 s += "/>";
				   }
				   else if (n.nodeType == 3)
					  s += n.nodeValue;
				   else if (n.nodeType == 4)
					  s += "<![CDATA[" + n.nodeValue + "]]>";
				   return s;
				};
				for (var c=node.firstChild; c; c=c.nextSibling)
				   s += asXml(c);
			 }
			 return s;
		  },
		  escape: function(txt) {
			 return txt.replace(/[\\]/g, "\\\\")
					   .replace(/[\"]/g, '\\"')
					   .replace(/&quot;/g, '\\"')
					   .replace(/[\n]/g, '\\n')
					   .replace(/[\r]/g, '\\r');
		  },
		  removeWhite: function(e) {
			 e.normalize();
			 for (var n = e.firstChild; n; ) {
				if (n.nodeType == 3) {  // text node
				   if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure whitespace text node
					  var nxt = n.nextSibling;
					  e.removeChild(n);
					  n = nxt;
				   }
				   else
					  n = n.nextSibling;
				}
				else if (n.nodeType == 1) {  // element node
				   X.removeWhite(n);
				   n = n.nextSibling;
				}
				else                      // any other node
				   n = n.nextSibling;
			 }
			 return e;
		  }
	   };
	   if (xml.nodeType == 9) // document node
		  xml = xml.documentElement;
	   var json = X.toJson(X.toObj(X.removeWhite(xml)), xml.nodeName, "\t");
	   return "{\n" + tab + (tab ? json.replace(/\t/g, tab) : json.replace(/\t|\n/g, "")) + "\n}";
	},
	getAspectRatio: function(currW, currH,targW, targH){
		var NewWidth;
		var NewHeight = currH*targW/currW;
		if (NewHeight > targH)
		{
			NewWidth = currW*targH/currH;
			NewHeight = targH;
		}else{
			NewWidth = targW;
		}
		return [NewWidth, NewHeight];
	},
	/* From:
	 * jQuery Timer Plugin
	 * http://www.evanbot.com/article/jquery-timer-plugin/23
	 *
	 * @version      1.0
	 * @copyright    2009 Evan Byrne (http://www.evanbot.com)
	 */ 
	timer: function(time,func,callback){
		var a = {timer:setTimeout(func,time),callback:null}
		if(typeof(callback) == 'function'){a.callback = callback;}
		return a;
	},

	clearTimer: function(a){
		clearTimeout(a.timer);
		if(typeof(a.callback) == 'function'){a.callback();};
		return this;
	},
	/* From:
	 * Mootools Browser Class (migrated)
	 * http://mootools.net
	 */
	Browser: {
		Engine: {name: 'unknown', version: 0},
		Platform: {name: (window.orientation != undefined) ? 'ipod' : (navigator.platform.match(/mac|win|linux/i) || ['other'])[0].toLowerCase()},
		Features: {xpath: !!(document.evaluate), air: !!(window.runtime), query: !!(document.querySelector)},
		Plugins: {},
		Engines: {
			presto: function(){
				return (!window.opera) ? false : ((arguments.callee.caller) ? 960 : ((document.getElementsByClassName) ? 950 : 925));
			},
			trident: function(){
				return (!window.ActiveXObject) ? false : ((window.XMLHttpRequest) ? ((document.querySelectorAll) ? 6 : 5) : 4);
			},
			webkit: function(){
				return (navigator.taintEnabled) ? false : (($.Browser.Features.xpath) ? (($.Browser.Features.query) ? 525 : 420) : 419);
			},
			gecko: function(){
				return (!document.getBoxObjectFor && window.mozInnerScreenX == null) ? false : ((document.getElementsByClassName) ? 19 : 18);
			}
		}
	},
	/*
	script: Swiff
	description: From Swiff Mootools (migrated).
	credits: 
	- Mootools
	*/
	Swiff: function(path,options){
		var opts = {
			id: null,
			height: 1,
			width: 1,
			container: null,
			properties: {},
			params: {
				quality: 'high',
				allowScriptAccess: 'always',
				wMode: 'transparent',
				swLiveConnect: true
			},
			callBacks: {},
			vars: {}
		};
		
		var objout = {};
		
		objout.instance = 'Swiff_' + $.time();

		$.extend(true,opts,options);
		options = objout.options = opts;
		var container = $.chk(options.container)?$(options.container):null;

		$.SwiffFx.CallBacks[objout.instance] = {};

		objout.params = options.params;
		objout.vars = options.vars;
		objout.callBacks = options.callBacks;
		objout.properties = {height: options.height, width: options.width};
		$.extend(objout.properties, options.properties);
		
		var id = objout.id = options.id || objout.instance;
		
		var self = objout;

		for (var callBack in objout.callBacks){
			$.SwiffFx.CallBacks[objout.instance][callBack] = (function(option){
				return function(){
					return option.apply(objout.callBacks[callBack], arguments);
				};
			})(objout.callBacks[callBack]);
			objout.vars[callBack] = '$.SwiffFx.CallBacks.' + objout.instance + '.' + callBack;
		}
		var fv = [];
		for (var cc in objout.vars)
			fv.push(cc+'='+encodeURIComponent(objout.vars[cc]));
		objout.params.flashVars = fv.join("&");
		objout.build = '';
		countbuild=1;
		
		objout.properties.data = path;
		if (!$.chk($.Browser.Engine.trident)){
			countbuild++;
			objout.properties.type = 'application/x-shockwave-flash';	
		}else{
			objout.params.movie = path;
			objout.properties.classid = 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000';
		}
		
		for(pw=0;pw<countbuild;pw++){
			objout.build += '<object' + ((pw==0)?(' id="' + id + '"'):'');
			//objout.build = '<object';
			for (var property in objout.properties) objout.build += ' ' + property + '="' + objout.properties[property] + '"';
			objout.build += '>';
			for (var param in objout.params){
				if (objout.params[param]) objout.build += '<param name="' + param + '" value="' + objout.params[param] + '" />';
			}
			if (countbuild > 1){
				delete objout.properties.classid;
				objout.properties.type = 'application/x-shockwave-flash';
			}
			if (pw > 0) objout.build += '</object>';
		}
		objout.build += '</object>';
		objout.container = ($.chk(container) ? container.empty() : $('<div>'));
		objout.container.html(objout.build);
		objout.el = objout.container.children()[0];
		$.extend(objout, {
			toElement: function(){
				return this.el;
			},
	
			replaces: function(element){
				element = $(element);
				element.parentNode.replaceChild(this.toElement(), element);
				return this;
			},
	
			inject: function(element){
				$(element).append(this.toElement());
				return this;
			},
			remote: function(){
				sp=[this.el];
				for (i=0;i<arguments.length;i++) sp.push(arguments[i]);
				return $.SwiffFx.remote.apply(this, sp);
			}
		});
		return objout;
	},
	SwiffFx: {
		CallBacks: {},
		remote: function(obj, fn){
			var rs = obj.CallFunction('<invoke name="' + fn + '" returntype="javascript">' + __flash__argumentsToXML(arguments, 2) + '</invoke>');
			return eval(rs);
		}
	},
	
	Cookie:{
		key: false,
		options: {
			path: false,
			domain: false,
			duration: false,
			secure: false,
			document: document
		},
		setOptions: function(o){
			$.extend($.Cookie.options,o);
		},
		write: function(key, value,options){
			var opts = $.Cookie.options;
			if ($.chk(options)) $.extend(opts,options);
			$.Cookie.key = key;
			value = encodeURIComponent(value);
			if (opts.domain) value += '; domain=' + opts.domain;
			if (opts.path) value += '; path=' + opts.path;
			if (opts.duration){
				var date = new Date();
				date.setTime(date.getTime() + opts.duration * 24 * 60 * 60 * 1000);
				value += '; expires=' + date.toGMTString();
			}
			if (opts.secure) value += '; secure';
			opts.document.cookie = key + '=' + value;
		},
		read: function(key){
			var opts = $.Cookie.options;
			var value = opts.document.cookie.match('(?:^|;)\\s*' + $.escapeRegExp(key) + '=([^;]*)');
			return (value) ? decodeURIComponent(value[1]) : null;
		},
		dispose: function(key){
			if ($.chk(key)) $.Cookie.key = key;
			key = $.Cookie.key;
			$.Cookie.write(key, "",{'duration': -1});
			return key;
		}
	}
	
});

//2nd level autoruns

(function($){	
	
	$.Browser.Platform[$.Browser.Platform.name] = true;
	
	$.Browser.detect = function(){
		for (var engine in $.Browser.Engines){
			var version = $.Browser.Engines[engine]();
			if (version){
				$.Browser.Engine = {name: engine, version: version};
				$.Browser.Engine[engine] = $.Browser.Engine[engine + version] = true;
				break;
			}
		}
		return {name: engine, version: version};
	};
	
	$.Browser.detect();
	
	$.fn.getCoordinates = function(){
		$this = this[0];
		p = $($this).offset();
		$.extend(p, $($this).getSize());
		return p;
	};
	
	$.fn.getSize = function(){
		w = (this[0].focus)? $(this[0]).width():$(this[0]).outerWidth();
		h = (this[0].focus)? $(this[0]).height():$(this[0]).outerHeight();
		return {'width': w, 'height': h};
	};
	
	$.fn.getNextHighestZindex = function(){
		var highestIndex = 0;
		var currentIndex = 0;
		var elArray = Array();
		this.each(function(){
			$this = this || document;
			elArray = $this.getElementsByTagName('*');
			for(var i=0; i < elArray.length; i++){
				if (elArray[i].currentStyle){
				currentIndex = parseFloat(elArray[i].currentStyle['zIndex']);
				}else if(window.getComputedStyle){
					currentIndex = parseFloat(document.defaultView.getComputedStyle(elArray[i],null).getPropertyValue('z-index'));
				}
				if(!isNaN(currentIndex) && currentIndex > highestIndex){ highestIndex = currentIndex; }
			}
		});
		return (highestIndex+1);
	};
		
	$.fn.fitAspectRatio = function(targ,ic){
		this.each(function(){
			mov = $(this);
			tc = targ.getSize();
			mc = mov.getSize();
			var NewHeight = mc.height*tc.width/mc.width;
			if ($.chk(ic)){
				targ.css('position', 'relative');
				mov.css('position', 'absolute');
			}
			if (NewHeight > tc.height)
			{
				mov.css('width', (mc.width*tc.height/mc.height)+'px');
				mov.css('height', tc.height+'px');
			}else{
				mov.css('width', tc.width+'px');
				mov.css('height', NewHeight+'px');
			}
			if ($.chk(ic)){
				mc = mov.getSize();
				mov.css('left', ((tc.width-mc.width)/2)+'px');
				mov.css('top', ((tc.height-mc.height)/2)+'px');
			}
		});
		return this;
	};
	
	$.fn.centerize = function(){
		this.each(function(){
			elwidth = ($(window).width()-$(this).outerWidth())/2;
			elheight = ($(window).height()-$(this).outerHeight())/2;
			$(this).css("left", elwidth);
			$(this).css("top", $(window).scrollTop()+elheight);
		});
		return $(this);
	};
	
	$.fn.maximize = function(){
		var docsize = $(document.body).getSize();
		this.each(function(){
			elwidth = ($(window).width()-$(this).outerWidth())/2;
			elheight = ($(window).height()-$(this).outerHeight())/2;
			$(this).css({"left": 0,"top": 0,"width": docsize.width, "height": docsize.height, "position": 'absolute'});
		});
		return $(this);
	};
	
	$.fn.unselectable = function(val){
		if (val){
			$(this).bind('selectstart', function(e){
				var e = e ? e : window.event;
		 
				if (e.button != 1) {
					if (e.target) {
						var targer = e.target;
					} else if (e.srcElement) {
						var targer = e.srcElement;
					}
		 
					var targetTag = targer.tagName.toLowerCase();
					if ((targetTag != "input") && (targetTag != "textarea")) {
						return false;
					}
				}
			});
		}else{
			$(this).bind('selectstart', function(e){
				return true;
			});
		}
	};
	
	jQuery.urlParam = function(url,name){
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
		if (!results) { return 0; }
		return results[1] || 0;
	}
	
	jQuery.get_urlhash_queryvalue = function(param,url) {
		if(url == undefined || url == '')
			url = window.location.href.replace(/(.*)?#/,'');
		return jQuery.urlParam('?'+url,param);
	}

	
	jQuery.addMask = function(options, append){
		$this = document.body;
		
		var opts = {
			'id': 'jMask'+$.time(),
			'opacity': .7,
			'background': '#000',
			'z-index': $(document.body).getNextHighestZindex()
		};
		$.extend(opts,options);
		var id=opts.id;
		delete opts.id;
		var docsize = $($this).getSize();
		$.extend(opts, {'width': docsize.width,
			'height': docsize.height,
			'position':'absolute',
			'top': 0, 'left': 0
		});
		var def = $('<div>',{'id': id}).css(opts);
		if (append) def.appendTo('body');
		return def;
	};
	
	
	
	$.dialogLoader = function(options){
		var objout = {};
		var opts = {html: null, msg: 'Alert!', button: 1, url: null, method: 'POST', zIndex: $(document.body).getNextHighestZindex(),
			clonehtml: true,
			styles: {'background': '#000','font-family': 'Arial, Georgia', 'font-size': '14px','color': '#FFF'},
			mask: {'background':'#222','opacity': .7},
			textclose: 'x',
			styleclose: {
				'display': 'block',
				'color': 'black',
				'width': '17px',
				'height': '15px',
				'background': 'white',
				'font-size': '9px',
				'padding-top': '3px',
				'text-decoration': 'none',
				'text-align': 'center',
				'font-family': 'Arial, sans, serif',
				'position': 'absolute',
				'top': '4px',
				'right': '4px',
				'border': 'none'
			}
		};
		
		$.extend(true,opts,options);
		
		res = $(document.body).getSize();
		def = $.addMask({
			'background': 'transparent',
			'opacity': 0,
			'z-index': opts.zIndex
		});
		
		def.attr('id','dl'+opts.zIndex);
		
		msk = $.addMask(opts.mask);
		msk.addClass('dlmask').appendTo(def);
		s = $(window).getSize();	
		whold = $('<div>',{'id': 'dlcont'+(opts.zIndex+1)});
		addo = {'left': 0, 'top': $(window).scrollTop(), 'z-index':opts.zIndex+1, 'float':'left', 'position':'relative', 'opacity': 0};
		$.extend(opts.styles,addo);
		whold.css(addo).appendTo(def);
		def.hide().appendTo('body');
		$.extend(objout, {
			'options': opts,
			'el': def,
			'mask': msk,
			'cont': whold,
			'loadDialog': function(url,ajax){
				if (url) this.options.url = url;
				var p = this;
				this.el.css('display', 'block');
				$(this.el).maximize();
				$(this.mask).maximize();
				$(this.cont).centerize();
				this.el.animate({'opacity': 1},300,function(){
					p.cont.empty();
					if (p.options.url != null){
						p.typedialog = $.chk(ajax)?"ajax":"html";
						p.cont.css(p.options.styles);
						p.cont.css('padding', '30px 10px 10px 10px');
						$.ajax({'url':p.options.url, 'type': p.options.method, success: function(t){
							//p.el2.adopt(myhtml);
							if (p.typedialog == "ajax"){
								rp2 = $.parseXml(t);
								//mpg.hide();
								eval('pew = ' + $.xml2json(rp2,""));
								if (pew.ajaxresponse.html) p.cont.html($.xmlData(pew.ajaxresponse.html));
								if (pew.ajaxresponse.run) eval($.xmlData(pew.ajaxresponse.run));
							}else{
								p.cont.html(t);
							}
							
							p.clbut = $('<a>', {
								href: 'javascript:'});
							p.clbut.css(p.options.styleclose);
							p.clbut.click(function(ev){ p.closeDialog(); });
							p.mask.click(function(ev){ p.closeDialog(); });
							if (p.options.textclose != '') p.clbut.text(p.options.textclose);
							p.clbut.appendTo(p.cont);
							p.cont.centerize();
							p.cont.animate({'opacity': 1},300);
							$(p).trigger('loadComplete');
						}});
					}else if ($.chk(p.options.html)){
						p.typedialog = "html";
						mhtml = (p.optionsclonehtml)?$(p.options.html).clone(true):$(p.options.html);
						mhtml.css({'display':'block','position':'static'});
						p.cont.append(mhtml);
						p.cont.centerize();
						p.mask.click(function(ev){ p.closeDialog(); });
						p.cont.animate({'opacity': 1},300);
						$(p).trigger('loadComplete');
					}else{
						p.cont.css(p.options.styles);
						p.typedialog = "alert";
						p.cont.css('padding', '10px');
						p.el3 = $('<div>').css({'width': '200px', 'text-align': 'center'});
						p.el4 = p.el3.clone();
						p.el3.text(p.options.msg);
						p.el3.css({'border-bottom': '1px dotted '+(p.options.styles.color || '#000'), 'padding-bottom': '5px', 'margin-bottom':'5px'});
						p.el3.appendTo(p.cont);
						p.el4.appendTo(p.cont);
						p.capts = [[],["OK"],["OK", "Cancel"],["Yes", "No"],["Yes", "No", "Cancel"]];
						p.el5 = [];
						for(i=0;i<p.capts[p.options.button].length;i++){
								p.el5.push($('<input>', {'type': 'button', 'id': 'bbutt'+(i+1), 'value': p.capts[p.options.button][i]}).css({ 'margin': '5px 0'}).bind('click', function(){ $(p).trigger('select', $(this).attr('id').slice(5)); p.closeDialog();}).appendTo(p.el4));
						}
						p.cont.centerize();
						p.cont.animate({'opacity': 1},300);
						$(p).trigger('loadComplete');
					}
				});
				this.generated = true;
				return this;
			},
			setMsgAnswer: function(aw){
				this.myanswer = aw;
				return this.el;
			},
			getMsgAnswer: function(){
				return this.myanswer;
			},
			closeDialog: function(){
				$(this).trigger('close');
				this.disposeElement = true;
				this.reallyclose();
			},
			reallyclose: function(){
				var p = this;
				p.cont.animate({'opacity': 0},200,function(){
					if ($.chk(p.disposeElement)) p.cont.remove();
					p.el.animate({'opacity': 0},200, function(){if ($.chk(p.disposeElement)) p.el.remove(); else p.el.hide(); $(p).trigger('reallyClose'); });
				});
			},
			hide: function(){
				$(this).trigger('close');
				this.disposeElement = false;
				this.reallyclose();
			},
			show: function(){
				var p = this;
				if ($.chk(this.generated)){
					$(this.el).maximize();
					$(this.mask).maximize();
					$(this.cont).centerize();
					$(this.el).css('display', 'block');
					$(this.el).animate({'opacity': 1},300, function(){
						p.cont.centerize();
						p.cont.animate({'opacity': 1},300);
					});
				}else{
					this.loadDialog();
				}
			}
		});
		return objout;
	};
})(jQuery);