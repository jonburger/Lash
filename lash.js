function extend(target, path) {
	target = target || {};
	
	if (/\b(Array)\b/.test({}.toString.call(target))) {
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
		
		target['@count'] = target['length'];
	}
	
	for (var property in target) {
		if (target.hasOwnProperty(property)) {
			
			(function(path, value){
				
				if (Object.getOwnPropertyDescriptor(target, property).configurable) {
					
					//console.log(property);
					
					Object.defineProperty(target, property, {
						configurable: /\b(Array)\b/.test({}.toString.call(target)),
						enumerable: true,
						get: function() {
							return value;
						},
						set: function(newValue) {
							updateDOM(path, value = /\b(Object|Array)\b/.test({}.toString.call(newValue)) ? extend(newValue, path) : newValue);
						}
					});
				}
				
				target[property] = value;
				
			}((path ? path + '.' : '') + property, target[property]));
		}
	}

	return target;
}

function updateDOM(path, value) {
  for (var type in binders) {
    if (binders.hasOwnProperty(type)) {
      
      var selector = '[data-lash-' + type + '|="' + path + '"]';
      
      [].forEach.call(document.querySelectorAll(selector), function(element) {
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
    }
  }
}

function updateModel(path, value) {
//   path.split('.').forEach(function(node) {
//     data
//   });
  
//   var props = path.split('.');
//   var node = data;
  
//   while (props.length) {
//     node = node[props.unshift()];
//   }
  
//   node =
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