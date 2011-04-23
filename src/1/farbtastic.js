/**
 * Farbtastic: jQuery color picker plug-in 1.3u
 * 
 * Farbtastic Color Picker
 * © 2008 Steven Wittens
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */

(function ($) {
	var console = window.console ? window.console : {
			log: $.noop,
			error: function (msg) {
				$.error(msg);
			}
		},
		debug = true;

	$._farbtastic = function (container, options) {
		var fb = this,
			defaults = {
				callback:		null,
				color:			"#808080",
				version:		1,
				width:			194
			},
			element, // $(div.farbtastic)
			image;

		fb.init = function () {
			// Parse options
			if (options && !options.callback) {
				options = { callback: options };
			}

			options = $.extend(true, defaults, options);
			options.wheelWidth = options.width / 10;

			// Touch support
			$.extend($.support, {
				touch: (typeof Touch === "object")
			});

			// Initialize
			fb.initWidget();

			// Install mousedown handler (the others are set on the document on-demand)
			element.find("*").bind("mousedown.farbtastic", fb.mousedown);

			// Install touch handlers to simulate appropriate mouse events
			if ($.support.touch) {
				element.find("*")
					.bind("touchstart.farbtastic touchmove.farbtastic touchend.farbtastic touchcancel.farbtastic", fb.touchHandle);
			}

			// Set linked elements/callback
			if (options.callback) {
				fb.linkTo(options.callback);
			}
		};

		/**
		 * Link to the given element(s) or callback
		 */
		fb.linkTo = function (callback) {
			// Unbind previous nodes
			if (typeof fb.callback === "object") {
				$(fb.callback).unbind("keyup.farbtastic", fb.updateValue);
			}

			// Reset color
			fb.color = null;

			// Bind callback or elements
			if (typeof callback === "function") {
				fb.callback = callback;
			} else if (typeof callback === "object" || typeof callback === "string") {
				fb.callback = $(callback);
				fb.callback.bind("keyup.farbtastic", fb.updateValue);

				if (fb.callback[0].value) {
					fb.setColor(fb.callback[0].value);
				} else {
					fb.setColor(options.color);
				}
			} else {
				fb.callback = null;
			}

			return this;
		};

		fb.updateValue = function (event) {
			if (this.value && this.value !== fb.color) {
				fb.setColor(this.value);
			}
		};

		/**
		 * Change color with HTML syntax #123456
		 */
		fb.setColor = function (color) {
			var unpack = $.farbtastic.colorUtilities.unpack(color, options.color);

			if (fb.color !== color && unpack) {
				fb.color = color;
				fb.rgb = unpack;
				fb.hsl = $.farbtastic.colorUtilities.RGBToHSL(fb.rgb);
				fb.updateDisplay();
			}

			return this;
		};

		/**
		 * Change color with HSL triplet [0..1, 0..1, 0..1]
		 */
		fb.setHSL = function (hsl) {
			fb.hsl = hsl;
			fb.rgb = $.farbtastic.colorUtilities.HSLToRGB(hsl);
			fb.color = $.farbtastic.colorUtilities.pack(fb.rgb);
			fb.updateDisplay();
			return this;
		};

		/////////////////////////////////////////////////////

		/**
		 * Initialize the color picker widget
		 */
		fb.initWidget = function () {
			// Insert markup
			$(container).html('<div class="farbtastic">' +
				'<div class="color"></div>' +
				'<div class="wheel"></div>' +
				'<div class="overlay"></div>' +
				'<div class="h-marker marker"></div>' +
				'<div class="sl-marker marker"></div>' +
				'</div>'
				);

			element = $(container).find(".farbtastic");
			
			// Determine layout
			fb.radius = 84;
			fb.square = 100;
			fb.mid = Math.floor(options.width / 2);

			fb.wheel = $(".wheel", container)[0];

			// Fix background PNGs in IE6
			if (navigator.appVersion.match(/MSIE [0-6]\./)) {
				element.find("*").each(function () {
					if (this.currentStyle.backgroundImage !== "none") {
						image = this.currentStyle.backgroundImage;
						image = this.currentStyle.backgroundImage.substring(5, image.length - 2);
						$(this).css({
							"backgroundImage": "none",
							"filter": "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, sizingMethod=crop, src='" + image + "')"
						});
					}
				});
			}

			fb.solidFill = element.find(".color");
		};

		/**
		 * Draw the selection markers.
		 */
		fb.drawMarkers = function () {
			var angle = fb.hsl[0] * 6.28,
				x1 =  Math.sin(angle) * fb.radius,
				y1 = -Math.cos(angle) * fb.radius,
				x2 = fb.square * (0.5 - fb.hsl[1]),
				y2 = fb.square * (0.5 - fb.hsl[2]);

			element.find(".h-marker").css({
				left: Math.round(x1 + fb.mid) + "px",
				top: Math.round(y1 + fb.mid) + "px"
			});

			element.find(".sl-marker").css({
				left: Math.round(x2 + fb.mid) + "px",
				top: Math.round(y2 + fb.mid) + "px"
			});
		};

		/**
		 * Update the markers and styles
		 */
		fb.updateDisplay = function () {
			// Determine whether labels/markers should invert
			fb.invert = fb.hsl[2] <= 0.5;

			// Saturation/Luminance gradient
			fb.solidFill.css("backgroundColor", $.farbtastic.colorUtilities.pack($.farbtastic.colorUtilities.HSLToRGB([fb.hsl[0], 1, 0.5])));

			// Draw markers
			fb.drawMarkers();

			// Linked elements or callback
			if (typeof fb.callback === "object") {
				// Set background/foreground color
				$(fb.callback).css({
					backgroundColor: fb.color,
					color: fb.invert ? "#fff" : "#000"
				});

				// Change linked value
				$(fb.callback).each(function () {
					if ((typeof this.value === "string") && this.value !== fb.color) {
						this.value = fb.color;
					}
				});
			} else if (typeof fb.callback === "function") {
				fb.callback.call(fb, fb.color);
			}
		};

		/**
		 * Helper for returning coordinates relative to the center
		 */
		fb.widgetCoords = function (event) {
			return {
				x: event.pageX - fb.offset.left - fb.mid,
				y: event.pageY - fb.offset.top - fb.mid
			};
		};

		/**
		 * Mousedown handler
		 */
		fb.mousedown = function (event) {
			// Capture mouse
			if (!$._farbtastic.dragging) {
				$(document).bind("mousemove.farbtastic", fb.mousemove).bind("mouseup.farbtastic", fb.mouseup);
				$._farbtastic.dragging = true;
			}

			// Update the stored offset for the widget
			fb.offset = $(fb.wheel).offset();

			// Check which area is being dragged
			var pos = fb.widgetCoords(event);
			fb.circleDrag = Math.max(Math.abs(pos.x), Math.abs(pos.y)) * 2 > fb.square;

			// Process
			fb.mousemove(event);
			return false;
		};

		/**
		 * Mousemove handler
		 */
		fb.mousemove = function (event) {
			// Get coordinates relative to color picker center
			var pos = fb.widgetCoords(event), hue, sat, lum;

			if (!fb.hsl) {
				return false;
			}

			// Set new HSL parameters
			if (fb.circleDrag) {
				hue = Math.atan2(pos.x, -pos.y) / 6.28;
				if (hue < 0) { hue += 1; }
				fb.setHSL([hue, fb.hsl[1], fb.hsl[2]]);
			} else {
				sat = Math.max(0, Math.min(1, -(pos.x / fb.square) + 0.5));
				lum = Math.max(0, Math.min(1, -(pos.y / fb.square) + 0.5));
				fb.setHSL([fb.hsl[0], sat, lum]);
			}

			return false;
		};

		/**
		 * Mouseup handler
		 */
		fb.mouseup = function () {
			// Uncapture mouse
			$(document).unbind(".farbtastic");
			$._farbtastic.dragging = false;
		};

		/**
		 * Simulate mouse events for touch devices
		 */
		fb.touchHandle = function (event) {
			var touches = event.originalEvent.changedTouches,
				firstTouch = touches[0],
				type = "",
				simulatedEvent;

			switch (event.type) {
				case 'touchstart':
					type = 'mousedown';
					break;
				case 'touchmove':
					type='mousemove';
					break;
				case 'touchend':
					type='mouseup';
					break;
				default:
					return false;
			}

			// initMouseEvent(
			//     type, canBubble, cancelable, view, clickCount, 
			//     screenX, screenY, clientX, clientY, ctrlKey, 
			//     altKey, shiftKey, metaKey, button, relatedTarget
			// );
			simulatedEvent = document.createEvent("MouseEvent");
			simulatedEvent.initMouseEvent(
				type, true, true, window, 1, 
				firstTouch.screenX, firstTouch.screenY, 
				firstTouch.clientX, firstTouch.clientY, false, 
				false, false, false, 0 /*left*/, null
			);

			firstTouch.target.dispatchEvent(simulatedEvent);
			event.preventDefault();
		};

		fb.init();
	};

	$.farbtastic = {
		messages: {
			noObject: "Something goes wrong, check object"
		},

		init: function (object, options) {
			var firstObject = null;

			return object.each(function () {
				// only first object used
				if (firstObject) {
					return;
				}

				firstObject = $(object[0]);

				if (!object.data("farbtastic")) {
					object.data("farbtastic", new $._farbtastic(object, options));
				}
			});
		},

		linkTo: function (object, callback) {
			var firstObject = null;

			return object.each(function () {
				// only first object used
				if (firstObject) {
					return;
				}

				firstObject = $(object[0]);

				if (object.data("farbtastic")) {
					object.data("farbtastic").linkTo(callback);
				}
			});
		},

		/* Various color utility functions */
		colorUtilities: {
			defaults: {
				color: "#000000"
			},

			dec2hex: function (x) {
				return (x < 16 ? "0" : "") + x.toString(16);
			},

			packDX: function (c, a) {
				return "#" + this.dec2hex(a) + this.dec2hex(c) + this.dec2hex(c) + this.dec2hex(c);
			},

			pack: function (rgb) {
				var r = Math.round(rgb[0] * 255),
					g = Math.round(rgb[1] * 255),
					b = Math.round(rgb[2] * 255);

				return "#" + this.dec2hex(r) + this.dec2hex(g) + this.dec2hex(b);
			},

			unpack: function (color, defaultColor) {
				function longForm(color, i) {
					return parseInt(color.substring(i, i + 2), 16) / 255;
				}

				function shortForm(color, i) {
					return parseInt(color.substring(i, i + 1), 16) / 15;
				}
				
				if (color.length === 7) {
					return [ longForm(color, 1), longForm(color, 3), longForm(color, 5) ];
				} else if (color.length === 4) {
					return [ shortForm(color, 1), shortForm(color, 2), shortForm(color, 3) ];
				}

				if (!defaultColor) {
					defaultColor = this.defaults.color;
				}

				return [ longForm(defaultColor, 1), longForm(defaultColor, 3), longForm(defaultColor, 5) ];
			},

			HSLToRGB: function (hsl) {
				var m1, m2, r, g, b,
					h = hsl[0], s = hsl[1], l = hsl[2];

				m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
				m1 = l * 2 - m2;
				return [
					this.hueToRGB(m1, m2, h + 0.33333),
					this.hueToRGB(m1, m2, h),
					this.hueToRGB(m1, m2, h - 0.33333)
				];
			},

			hueToRGB: function (m1, m2, h) {
//				h = (h < 0) ? h + 1 : ((h > 1) ? h - 1 : h);
				h = (h + 1) % 1;

				if (h * 6 < 1) {
					return m1 + (m2 - m1) * h * 6;
				}
				if (h * 2 < 1) {
					return m2;
				}
				if (h * 3 < 2) {
					return m1 + (m2 - m1) * (0.66666 - h) * 6;
				}
				return m1;
			},

			RGBToHSL: function (rgb) {
				var r = rgb[0], g = rgb[1], b = rgb[2],
					min = Math.min(r, g, b),
					max = Math.max(r, g, b),
					delta = max - min,
					h = 0,
					s = 0,
					l = (min + max) / 2;

				if (l > 0 && l < 1) {
					s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));
				}

				if (delta > 0) {
					if (max === r && max !== g) {
						h += (g - b) / delta;
					}
					if (max === g && max !== b) {
						h += (2 + (b - r) / delta);
					}
					if (max === b && max !== r) {
						h += (4 + (r - g) / delta);
					}
					h /= 6;
				}

				return [h, s, l];
			}
		},

		plugin: {
			exists: function () {
				return false;
			}
		}
	};

	$.fn.farbtastic = function (method) {
		var args = arguments, plugin;

		if ("undefined" !== typeof $.farbtastic[method]) {
			args = Array.prototype.concat.call([args[0]], [this], Array.prototype.slice.call(args, 1));
			return $.farbtastic[method].apply($.farbtastic, Array.prototype.slice.call(args, 1));
		} else if ("object" === typeof method || !method) {
			Array.prototype.unshift.call(args, this);
			return $.farbtastic.init.apply($.farbtastic, args);
		} else if ($.farbtastic.plugin.exists(method)) {
			plugin = $.farbtastic.plugin.parseName(method);
			args = Array.prototype.concat.call([args[0]], [this], Array.prototype.slice.call(args, 1));
			return $.farbtastic[plugin.name][plugin.method].apply($.farbtastic[plugin.name], Array.prototype.slice.call(args, 1));
		} else {
			console.error("Method '" +  method + "' does not exist on jQuery.farbtastic.\nTry to include some extra controls or plugins");
		}
	};
})(jQuery);
