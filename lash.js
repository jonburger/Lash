


function template(string/*, scope*/) {
	var model = {};

	var strings = string.split(/\{\{.*?\}\}/g);

	var expressions = (string.match(/\{\{.*?\}\}/g) || []).map(function(exp) {
		return { toString: function() { return expression(exp.slice(2,-2)/*, scope*/)(model); } };
	});

	var result = [strings[0]];

	expressions.forEach(function(exp, i) {
		result.push(exp, strings[i + 1]);
	});

	//console.log(result);

	return (function(data) {
		model = data;
		return result.join('');
	});
};


function expression(string/*, scope*/) {
	return (new Function('model', 'return ' + string))/*.bind(scope || window)*/;
};


function type(object, type) {
	var t = ({}).toString.call(object).slice(8,-1);
	return type ? t === type : t;
};



function LArray(buffer) {

	/*Object.defineProperties(this, {
		items: {
			configurable: true,
			enumerable: false,
			writable: true,
			value: []
		},
		length: {
			configurable: false,
			enumerable: false,
			get: function() {
				return this.items.length
			},
			set: function(newlength) {
				console.log('length changed');
				this.items.length = newlength;
			}
		}
	});*/

	this.updateIndexes(buffer);

	// return new Proxy(this, {
	// 	get: function(target, name){
	// 		return name in target ? target[name] : target.items[name];
	// 	},
	// 	set: function(target, name, value){
	// 		name in target ? target[name] = value : target.items[name] = value;
	// 	}
	// });
}

LArray.prototype = {
	items: [],
	get length() {
		return this.items.length
	},
	set length(newlength) {
		console.log('length changed');
		this.items.length = newlength;
	},
	updateIndexes: function(buffer) {
		var indexes = {};
		var min = this.items.length;
		var i = buffer || Math.max(Math.ceil(min * 1.25), 100);

		//for (;--i >= min;) {
		while (--i >= min) {
			(function(scope, i){
				indexes[i] = {
					configurable: true,
					enumerable: true,
					get: function() {
						console.log('property get');
						return scope[i];
					},
					set: function(value) {
						console.log('property set');
						scope[i] = value;
					}
				};
			}(this.items, i));
		}

		Object.defineProperties(this, indexes);
	}
};

// static methods (only really works with `of` and `from`)
Object.getOwnPropertyNames(Array).forEach(function(property) {
	if (type(Array[property], 'Function')) {
		LArray[property] = function(){
			larray = new LArray();
			larray.items = Array[property].apply(null, arguments);
			larray.updateIndexes()
			return larray;
		}
	}
});

// instance methods
Object.getOwnPropertyNames(Array.prototype).forEach(function(property) {
	if (type(([])[property], 'Function')) {
		LArray.prototype[property] = function(){
			console.log('method call', property);
			var value = [][property].apply(this.items, arguments);
			return Array.isArray(value) ? LArray.from(value) : value;
		}
	}
});





function Lash(element, model) {
	var adom = document.querySelector(element);
	var vdom = createVirtualDOM(adom);

	//console.log(createActualDOM(vdom));

	adom = adom.parentNode.replaceChild(createActualDOM(vdom), adom);
	// adom.parentNode.removeChild(adom);

	return {
		// model
		get model() {
			return model;
		},
		set model(newmodel) {
			model = newmodel;
		},
		// dom
		get adom() {
			return adom;
		},
		// vdom
		get vdom() {
			return vdom;
		}
	};

	function createActualDOM(node) {
		var target = document.createDocumentFragment();

		walk([node], target);

		return target;

		function walk(source, target) {
			[].forEach.call(source, function (item) {
				// element
				if (item.nodeType === 1) {
					var anode = target.appendChild(document.createElement(item.tagName));

					walk(item.attributes, anode);
					walk(item.childNodes, anode);
				}
				// text
				else if (item.nodeType === 3) {
					target.appendChild(document.createTextNode(item.textContent));
				}
				// attribute
				else if (item.name && item.value) {
					target.setAttribute(item.name, item.value);
				}
			});
		}
	}

	function createVirtualDOM(node) {
		return node && node.nodeType === 1 ? walk([node])[0] : {};

		function walk(source) {
			var target = [];

			[].forEach.call(source, function (item) {
				var templ;
				var vnode;

				// element
				if (item.nodeType === 1) {
					vnode = {
						nodeType: 1,
						tagName: item.tagName,
						attributes: walk(item.attributes),
						childNodes: walk(item.childNodes)
					};
				}
				// text
				else if (item.nodeType === 3) {
					templ = template(item.textContent);
					vnode = {
						nodeType: 3,
						get textContent() {
							return templ(model);
						}
					};
				}
				// attribute
				else if (item.name && item.value) {
					templ = template(item.value);
					target[item.name] = vnode = {
						name: item.name,
						get value() {
							return templ(model);
						}
					};

					// Object.defineProperty(target, vnode.name, {
					// 	configurable: false,
					// 	enumerable: false,
					// 	writable: false,
					// 	value: vnode
					// });
				}

				target[target.length] = vnode;
			});

			return target;
		};
	};
}


var model = {
	"fname": "Jon",
	"lname": "B",
	"friends": [
		{
			"fname": "Amy",
			"lname": "C"
		},
		{
			"fname": "Nick",
			"lname": "Clinton"
		}
	]
};

var lash = new Lash('.app', model);