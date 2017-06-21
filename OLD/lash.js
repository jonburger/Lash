(function(){
	'use strict';
	
	window.Lash = function(model) {
	
		var config = {
			namespace: 'lash',
			scope: document,
			binders: {
				value: {
					get: function() {
						return this.value;
					},
					set: function(value) {
						this.value = value;
					}
				},
				checked: {
					get: function() {
						return this.checked && (this.value || true);
					},
					set: function(value) {
						this.checked = value && (this.value === value || this.value === undefined);
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
				if: {
					set: function(value) {
						//console.log(this, value);
						this.hidden = !value;
					}
				}
			}
		};
		
		
		//return 
		extend(model);
		
		var checked = {};
		
		Object.keys(config.binders).forEach(function(type) {
			var attribute = 'data-' + config.namespace + '-' + type;
			[].forEach.call(config.scope.querySelectorAll('[' + attribute + ']'), function(element) {
				var path = element.getAttribute(attribute);
				if (!checked[path]) {
					checked[path] = true;
					var value = path.split('.').reduce(function(previous, current, index, array) {
						return previous && current && previous[current];
					}, model);
					updateDOM(path, value);
				}
			});
		});
		
		checked = {};


		function extend(target, path) {
			
			if (type(target, 'Array')) {
				// monkey patch array methods allowing us to modify arrays and see the changes reflected in the DOM
				Object.getOwnPropertyNames(Array.prototype).forEach(function(property) {
					if ((Object.getOwnPropertyDescriptor(target, property) || { configurable: true }).configurable) {
						if (type([][property], 'Function')) {
							Object.defineProperty(target, property, {
								get: function() { 
									return function() {
										var returnValue = [][property].apply(target, arguments);
										extend(target, path);
										
										//if(target.length == 0 ) console.log(target.length, path);
										
										return returnValue;
									};
								}
							});
						}
					}
				});
				
				// add a custom 'templatable' property mirroring the array length property
				target['@count'] = target['length'];
			}
			
			if (type(target, 'Object', 'Array')) {
				// update our POJO with custom getters and setters allowing us to update the DOM
				Object.keys(target).forEach(function(property) {
					
					//console.log(target, path, property, (path ? path + '.' : '') + property);
					
					if(target.length == 0 ) console.log(target.length, path, target[property]);
					
					setProperty(target, property, target[property], (path ? path + '.' : '') + property);
				});
			}

			return target;
		}


		function setProperty(target, property, value, path) {
			
			//console.log(target,property,path,value);
			
			if (!target.hasOwnProperty(property) || Object.getOwnPropertyDescriptor(target, property).configurable) {
				Object.defineProperty(target, property, {
					enumerable: true,
					get: function() {
						return value;
					},
					set: function(newValue) {
						updateDOM(path, value = type(newValue, 'Object', 'Array') ? extend(newValue, path) : newValue);
					}
				});
			}
			
			return target[property] = value;
		}


		function updateDOM(path, value) {
			
			Object.keys(config.binders).forEach(function(type) {
				[].forEach.call(config.scope.querySelectorAll('[data-' + config.namespace + '-' + type + '|="' + path + '"]'), function(element) {
					config.binders[type].set.call(element, value);

					var binding = element.getAttribute('data-' + config.namespace + '-' + type);

					if (binding.indexOf('-') > -1) {
						binding.split('-')[1].split(',').forEach(function(event) {
							if (!element['_' + type + '-' + event]) {

								element['_' + type + '-' + event] = function () {

									updateModel(path, config.binders[this.type].get.call(this.element));

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
			}, model);
		}


		function type(object) {
			var t = ({}).toString.call(object).slice(8,-1);
			return arguments.length > 1 ? (new RegExp('^' + ([]).slice.call(arguments, 1).join('|') + '$', 'i')).test(t) : t;
		}
	}

}());