function extend(target, path) {
	target = target || {};
	
	if (/\b(Array)\b/.test({}.toString.call(target))) {
		
		// monkey patch array methods allowing us to modify arrays and see the changes live
		Object.getOwnPropertyNames(Array.prototype).forEach(function(property) {
			if (typeof [][property] === 'function') {
				Object.defineProperty(target, property, {
					writable: true,
					value: function() {
						var returnValue = [][property].apply(target, arguments);
						extend(target, path);
						return returnValue;
					}
				});
			}
		});
		
		// add a custom 'templatable' property mirroring the array length property
		target['@count'] = target['length'];
	}
	
	// update our POJO with custom getters and setters allowing us to update the DOM
	Object.keys(target).forEach(function(property) {
		setProperty(target, property, target[property], (path ? path + '.' : '') + property);
	});

	return target;
}


function setProperty(target, property, value, path) {
	
	if (!target.hasOwnProperty(property) || Object.getOwnPropertyDescriptor(target, property).configurable) {
		Object.defineProperty(target, property, {
			configurable: /\b(Object|Array)\b/.test({}.toString.call(target)),
			enumerable: true,
			get: function() {
				return value;
			},
			set: function(newValue) {
				updateDOM(path, value = /\b(Object|Array)\b/.test({}.toString.call(newValue)) ? extend(newValue, path) : newValue);
			}
		});
	}
	
	return target[property] = value;
}


function updateDOM(path, value) {
	Object.keys(binders).forEach(function(type) {
		[].forEach.call(document.querySelectorAll('[data-lash-' + type + '|="' + path + '"]'), function(element) {
			binders[type].set.call(element, value);

			var binding = element.getAttribute('data-lash-' + type);

			if (binding.indexOf('-') > -1) {
				binding.split('-')[1].split(',').forEach(function(event) {
					if (!element['_' + type + '-' + event]) {

						element['_' + type + '-' + event] = function () {

							updateModel(path, binders[this.type].get.call(this.element));

						}.bind({ type: type, element: element});

						element.addEventListener(event, element['_' + type + '-' + event]);
					}
				});
			}
		});
	});
}


function updateModel(path, value) {
	return path.split('.').reduce(function(previous, current, index, array) {
		return index < array.length - 1 ? previous[current] || setProperty(previous, current, {}, array.slice(0, index + 1).join('.')) : setProperty(previous, current, value, path);
	}, data);
}


var binders = {
	value: {
		get: function() {
			return this.value;
		},
		set: function(value) {
			this.value = value;
		}
	},
	html: {
		get: function() {
			return this.innerHTML;
		},
		set: function(value) {
			this.innerHTML = value;
		}
	},
	text: {
		get: function() {
			return this.innerText;
		},
		set: function(value) {
			this.innerText = value;
		}
	},
}