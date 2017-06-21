
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


// values are simple keys (currently only works one level)
// var hello = template('<p>Hello {{fname}} {{lname}}! {{2*2}}</p>');

// document.body.insertAdjacentHTML('beforeend', hello({'fname': 'Jon', 'lname': 'B'}));


// values are expressions
//var hello = template('<p>Hello {{model.fname}} {{model.lname}}! {{2*2}}</p>');

//document.body.insertAdjacentHTML('beforeend', hello({'fname': 'Jon', 'lname': 'B'}));

//console.log(tree(document.documentElement));


var tmpl = '<p>Hello {{model.fname}} {{model.lname}}! {{2*2}}</p>';
var frag = document.querySelector('div.app');

//frag.insertAdjacentHTML('beforeend', tmpl);

var obj1 = tree(frag);

console.log(obj1);

create(document.body, obj1);





// function template(string) {
// 	var strings = string.split(/\{\{.*?\}\}/g);
// 	var keys = (string.match(/\{\{.*?\}\}/g) || []).map(function(key){ return key.slice(2,-2); });
// 	var result;

// 	return (function(data) {
// 		result = [strings[0]];

// 		keys.forEach(function(key, i) {
// 			result.push(data[key], strings[i + 1]);
// 		});

// 		return result.join('');
// 	});
// };


function template(string, scope) {
	var result;
	var strings = string.split(/\{\{.*?\}\}/g);
	var exps = (string.match(/\{\{.*?\}\}/g) || []).map(function(exp) {
		//return (new Function('model', 'return ' + exp.slice(2,-2))).bind(scope || window);
		return expression(exp.slice(2,-2), scope);
	});

	return (function(data) {
		result = [strings[0]];

		exps.forEach(function(exp, i) {
			result.push(exp(data), strings[i + 1]);
		});

		return result.join('');
	});
};

// function compile(string, model) {
// 	var result;
// 	var strings = string.split(/\{\{.*?\}\}/g);
// 	var exps = (string.match(/\{\{.*?\}\}/g) || []).map(function(exp) {
// 		//return (new Function('model', 'return ' + exp.slice(2,-2))).bind(scope || window);
// 		return expression(exp.slice(2,-2));
// 	});

// 	return (function() {
// 		result = [strings[0]];

// 		exps.forEach(function(exp, i) {
// 			result.push(exp(model), strings[i + 1]);
// 		});

// 		return result.join('');
// 	});
// };

function expression(string, scope) {
	return (new Function('model', 'return ' + string)).bind(scope || window);
};


function tree(node) {
	return node && node.nodeType && node.nodeName ? walk([node]) : {};

	function walk(source) {
		var target = [];

		target.forEach.call(source, function (item) {
			var compiled = template(item.textContent || '');

			target[target.length] = {
				nodeType: item.nodeType || 0,
				nodeName: item.nodeName || '',
				attributes: item.attributes ? walk(item.attributes) : [],
				childNodes: item.childNodes ? walk(item.childNodes) : [],
				//textContent: ({toString:compile(item.textContent || '', model)})
				get textContent() {
					return compiled(model);
				}
			};
		});

		return target;
	};
};


function create(target, children) {

	if (children && children.length) {
		[].forEach.call(children, function (child) {
			if (child.nodeType === 1) {
				var newNode = document.createElement(child.nodeName);

				create(newNode, child.attributes);
				create(newNode, child.childNodes);

				target.appendChild(newNode);
			}
			else if (child.nodeType === 2) {
				target.setAttribute(child.nodeName, child.textContent);
			}
			else if (child.nodeType === 3) {
				target.appendChild(document.createTextNode(child.textContent));
			}
		});
	}

	return target;
};







var binders = {
	items: function(value, node) {
		var array = expression(value, node)(model);
		var html = node.innerHTML;

		node.innerHTML = '';

		array.forEach(function(item, i) {
			node.insertAdjacentHTML('beforeend', html);
		});

		node.parentNode.removeChild(node);
	},
	text: function(value, node) {
		node.innerText = template(value, this)(model);
	}
};

// [].forEach.call(document.querySelectorAll('[data-lash]'), function(container){
// 	for (var binder in binders) {
// 		[].forEach.call(container.querySelectorAll('[data-lash-' + binder + ']'), function(item) {
// 			binders[binder](item.getAttribute('data-lash-' + binder), item);
// 		});
// 	};
// });


function type(object, type) {
	var t = ({}).toString.call(object).slice(8,-1);
	return type ? t === type : t;
};

// // augmented array
// function LArray(length) {
// 	Object.defineProperty(this, 'length', {
// 		configurable: false,
// 		enumerable: false,
// 		get: function() {
// 			return (length = Object.keys(this).length || length || 0);
// 		},
// 		set: function(newlength) {
// 			console.log('length changed');
// 			length = newlength;
// 		}
// 	});
// }

// // static methods
// Object.getOwnPropertyNames(Array).forEach(function(property) {
// 	if (type(Array[property], 'Function')) {
// 		LArray[property] = Array[property];
// 	}
// });

// // instance methods
// Object.getOwnPropertyNames(Array.prototype).forEach(function(property) {
// 	if (type(([])[property], 'Function')) {
// 		Object.defineProperty(LArray.prototype, property, {
// 			configurable: false,
// 			enumerable: false,
// 			writable: false,
// 			value: function () {
// 				console.log('method call: ', property);
// 				var value = ([])[property].apply(this, arguments);
// 				return Array.isArray(value) ? LArray.from(value) : value;
// 			}
// 		});
// 	}
// });

// limitations
// doesn't trigger any event for my_l_array[0] = 'some value';



function LArray(buffer) {

	Object.defineProperty(this, 'items', {
		configurable: true,
		enumerable: false,
		writable: true,
		value: []
	});

	Object.defineProperty(this, 'length', {
		configurable: false,
		enumerable: false,
		get: function() {
			return this.items.length
		},
		set: function(newlength) {
			console.log('length changed');
			this.items.length = newlength;
		}
	});

	for (var i = 0; i < (buffer || 1000); i++) {
		(function(target, key){
			Object.defineProperty(target, key, {
				configurable: true,
				enumerable: true,
				get: function() {
					console.log('property get');
					return this.items[key];
				},
				set: function(value) {
					console.log('property set');
					this.items[key] = value;
				}
			});
		}(this, i));
	}
}

// static methods (only really works with `of` and `from`)
Object.getOwnPropertyNames(Array).forEach(function(property) {
	if (type(Array[property], 'Function')) {
		LArray[property] = function(){
			larray = new LArray();
			larray.items = Array[property].apply(null, arguments);
			return larray;
		}
	}
});

// instance methods
Object.getOwnPropertyNames(Array.prototype).forEach(function(property) {
	if (type(([])[property], 'Function')) {
		Object.defineProperty(LArray.prototype, property, {
			configurable: false,
			enumerable: false,
			writable: false,
			value: function () {
				console.log('method call', property);
				var value = [][property].apply(this.items, arguments);
				return Array.isArray(value) ? LArray.from(value) : value;
			}
		});
	}
});