export function initializeCarousel() {
	var Carousel = function (opts) {
		this.options = extendProps(Carousel.defaults, opts);
		this.element = this.options.element;
		this.listWrapper = this.element.getElementsByClassName('carousel__inner')[0];
		this.list = this.element.getElementsByClassName('carousel__list')[0];
		this.items = this.element.getElementsByClassName('carousel__item');
		this.initItems = []; // записываем только оригинальные элементы
		this.itemsNb = this.items.length; // первоначальное количество элементов
		this.visibItemsNb = 1; // общее количество видимых элементов
		this.itemsWidth = 1; // это значение будет обновлено с учетом ширины элементов
		this.itemOriginalWidth = false; // записываем начальную ширину, чтобы использовать её при изменении размера
		this.selectedItem = 0; // индекс первого видимого элемента
		this.translateContainer = 0; // то, на сколько нужно перемещать контейнер каждый раз, когда необходимо отобразить новую группу
		this.containerWidth = 0; // будет использоваться для хранения общей ширины карусели
		this.ariaLive = false;
		// управление
		this.controls = this.element.getElementsByClassName('carousel__control');
		this.animating = false;
		// автовоспроизведение
		this.autoplayId = false;
		this.autoplayPaused = false;
		// изменение размера
		this.resizeId = false;
		// используется для повторной инициализации
		this.cloneList = [];
		// записываем минимальную ширину элементов
		this.itemAutoSize = false;
		// записываем значение translate
		this.totTranslate = 0;
		if (this.options.nav) this.options.loop = false;
		// записываем элементы счетчика (если они есть)
		this.counter = this.element.getElementsByClassName('carousel__counter');
		this.counterTor = this.element.getElementsByClassName('carousel__total');
		initCarouselLayout(this); // получаем количество видимых элементов + ширину элементов
		setItemsWidth(this, true);
		insertBefore(this, this.visibItemsNb); // помещаем клоны перед видимыми элементами
		updateCarouselClones(this); // помещаем клоны после видимых элементов
		resetItemsTabIndex(this); // следим за тем, чтобы невидимые элементы не были в фокусе
		initAriaLive(this);
		initCarouselEvents(this);
		initCarouselCounter(this);
		this.element.classList.add('carousel--is-loaded');
	};
	Carousel.prototype.showNext = function () {
		showNextItems(this);
	};
	Carousel.prototype.showPrev = function () {
		showPrevItems(this);
	};
	Carousel.prototype.startAutoplay = function () {
		startAutoplay(this);
	};
	Carousel.prototype.pauseAutoplay = function () {
		pauseAutoplay(this);
	};

	function initCarouselLayout(carousel) {
		var itemStyle = window.getComputedStyle(carousel.items[0]),
			containerStyle = window.getComputedStyle(carousel.listWrapper),
			itemWidth = parseFloat(itemStyle.getPropertyValue('width')),
			itemMargin = parseFloat(itemStyle.getPropertyValue('margin-right')),
			containerPadding = parseFloat(containerStyle.getPropertyValue('padding-left')),
			containerWidth = parseFloat(containerStyle.getPropertyValue('width'));
		if (!carousel.itemAutoSize) {
			carousel.itemAutoSize = itemWidth;
		}
		containerWidth = getCarouselWidth(carousel, containerWidth);
		if (!carousel.itemOriginalWidth) {
			carousel.itemOriginalWidth = itemWidth;
		} else {
			itemWidth = carousel.itemOriginalWidth;
		}
		if (carousel.itemAutoSize) {
			carousel.itemOriginalWidth = parseInt(carousel.itemAutoSize);
			itemWidth = carousel.itemOriginalWidth;
		}
		if (containerWidth < itemWidth) {
			carousel.itemOriginalWidth = containerWidth;
			itemWidth = carousel.itemOriginalWidth;
		}
		carousel.visibItemsNb = parseInt((containerWidth - 2 * containerPadding + itemMargin) / (itemWidth + itemMargin));
		carousel.itemsWidth = parseFloat(((containerWidth - 2 * containerPadding + itemMargin) / carousel.visibItemsNb - itemMargin).toFixed(1));
		carousel.containerWidth = (carousel.itemsWidth + itemMargin) * carousel.items.length;
		carousel.translateContainer = 0 - (carousel.itemsWidth + itemMargin) * carousel.visibItemsNb;
		if (!flexSupported) carousel.list.style.width = (carousel.itemsWidth + itemMargin) * carousel.visibItemsNb * 3 + 'px';
		carousel.totTranslate = 0 - carousel.selectedItem * (carousel.itemsWidth + itemMargin);
		if (carousel.items.length <= carousel.visibItemsNb) carousel.totTranslate = 0;
		centerItems(carousel);
		alignControls(carousel);
	}

	function setItemsWidth(carousel, bool) {
		for (var i = 0; i < carousel.items.length; i++) {
			carousel.items[i].style.width = carousel.itemsWidth + 'px';
			if (bool) carousel.initItems.push(carousel.items[i]);
		}
	}

	function updateCarouselClones(carousel) {
		if (!carousel.options.loop) return;
		if (carousel.items.length < carousel.visibItemsNb * 3) {
			insertAfter(carousel, carousel.visibItemsNb * 3 - carousel.items.length, carousel.items.length - carousel.visibItemsNb * 2);
		} else if (carousel.items.length > carousel.visibItemsNb * 3) {
			removeClones(carousel, carousel.visibItemsNb * 3, carousel.items.length - carousel.visibItemsNb * 3);
		}
		setTranslate(carousel, 'translateX(' + carousel.translateContainer + 'px)');
	}

	function initCarouselEvents(carousel) {
		if (carousel.options.nav) {
			carouselCreateNavigation(carousel);
			carouselInitNavigationEvents(carousel);
		}
		if (carousel.controls.length > 0) {
			carousel.controls[0].addEventListener('click', function (event) {
				event.preventDefault();
				showPrevItems(carousel);
				updateAriaLive(carousel);
			});
			carousel.controls[1].addEventListener('click', function (event) {
				event.preventDefault();
				showNextItems(carousel);
				updateAriaLive(carousel);
			});
			resetCarouselControls(carousel);
			emitCarouselActiveItemsEvent(carousel);
		}
		if (carousel.options.autoplay) {
			startAutoplay(carousel);
			if (!carousel.options.autoplayOnHover) {
				carousel.element.addEventListener('mouseenter', function (event) {
					pauseAutoplay(carousel);
					carousel.autoplayPaused = true;
				});
				carousel.element.addEventListener('mouseleave', function (event) {
					carousel.autoplayPaused = false;
					startAutoplay(carousel);
				});
			}
			if (!carousel.options.autoplayOnFocus) {
				carousel.element.addEventListener('focusin', function (event) {
					pauseAutoplay(carousel);
					carousel.autoplayPaused = true;
				});
				carousel.element.addEventListener('focusout', function (event) {
					carousel.autoplayPaused = false;
					startAutoplay(carousel);
				});
			}
		}
		window.addEventListener('resize', function (event) {
			pauseAutoplay(carousel);
			clearTimeout(carousel.resizeId);
			carousel.resizeId = setTimeout(function () {
				resetCarouselResize(carousel);
				resetDotsNavigation(carousel);
				resetCarouselControls(carousel);
				setCounterItem(carousel);
				startAutoplay(carousel);
				centerItems(carousel);
				alignControls(carousel);
				emitCarouselActiveItemsEvent(carousel);
			}, 250);
		});
		carousel.element.addEventListener('keydown', function (event) {
			if ((event.keyCode && event.keyCode == 39) || (event.key && event.key.toLowerCase() == 'arrowright')) {
				carousel.showNext();
			} else if ((event.keyCode && event.keyCode == 37) || (event.key && event.key.toLowerCase() == 'arrowleft')) {
				carousel.showPrev();
			}
		});
	}

	function showPrevItems(carousel) {
		if (carousel.animating) return;
		carousel.animating = true;
		carousel.selectedItem = getIndex(carousel, carousel.selectedItem - carousel.visibItemsNb);
		animateList(carousel, '0', 'prev');
	}

	function showNextItems(carousel) {
		if (carousel.animating) return;
		carousel.animating = true;
		carousel.selectedItem = getIndex(carousel, carousel.selectedItem + carousel.visibItemsNb);
		animateList(carousel, carousel.translateContainer * 2 + 'px', 'next');
	}

	function animateList(carousel, translate, direction) {
		pauseAutoplay(carousel);
		carousel.list.classList.add('carousel__list--animating');
		var initTranslate = carousel.totTranslate;
		if (!carousel.options.loop) {
			translate = noLoopTranslateValue(carousel, direction);
		}
		setTimeout(function () {
			setTranslate(carousel, 'translateX(' + translate + ')');
		});
		if (transitionSupported) {
			carousel.list.addEventListener('transitionend', function cb(event) {
				if (event.propertyName && event.propertyName != 'transform') return;
				carousel.list.classList.remove('carousel__list--animating');
				carousel.list.removeEventListener('transitionend', cb);
				animateListCb(carousel, direction);
			});
		} else {
			animateListCb(carousel, direction);
		}
		if (!carousel.options.loop && initTranslate == carousel.totTranslate) {
			carousel.list.dispatchEvent(new CustomEvent('transitionend'));
		}
		resetCarouselControls(carousel);
		setCounterItem(carousel);
		emitCarouselActiveItemsEvent(carousel);
	}

	function noLoopTranslateValue(carousel, direction) {
		var translate = carousel.totTranslate;
		if (direction == 'next') {
			translate = carousel.totTranslate + carousel.translateContainer;
		} else if (direction == 'prev') {
			translate = carousel.totTranslate - carousel.translateContainer;
		} else if (direction == 'click') {
			translate = carousel.selectedDotIndex * carousel.translateContainer;
		}
		if (translate > 0) {
			translate = 0;
			carousel.selectedItem = 0;
		}
		if (translate < -carousel.translateContainer - carousel.containerWidth) {
			translate = -carousel.translateContainer - carousel.containerWidth;
			carousel.selectedItem = carousel.items.length - carousel.visibItemsNb;
		}
		if (carousel.visibItemsNb > carousel.items.length) translate = 0;
		carousel.totTranslate = translate;
		return translate + 'px';
	}

	function animateListCb(carousel, direction) {
		if (direction) updateClones(carousel, direction);
		carousel.animating = false;
		startAutoplay(carousel);
		resetItemsTabIndex(carousel);
	}

	function updateClones(carousel, direction) {
		if (!carousel.options.loop) return;
		var index = direction == 'next' ? 0 : carousel.items.length - carousel.visibItemsNb;
		removeClones(carousel, index, false);
		direction == 'next' ? insertAfter(carousel, carousel.visibItemsNb, 0) : insertBefore(carousel, carousel.visibItemsNb);
		setTranslate(carousel, 'translateX(' + carousel.translateContainer + 'px)');
	}

	function insertBefore(carousel, nb, delta) {
		if (!carousel.options.loop) return;
		var clones = document.createDocumentFragment();
		var start = 0;
		if (delta) start = delta;
		for (var i = start; i < nb; i++) {
			var index = getIndex(carousel, carousel.selectedItem - i - 1),
				clone = carousel.initItems[index].cloneNode(true);
			clone.classList.add('is-cloned');
			clones.insertBefore(clone, clones.firstChild);
		}
		carousel.list.insertBefore(clones, carousel.list.firstChild);
		emitCarouselUpdateEvent(carousel);
	}

	function insertAfter(carousel, nb, init) {
		if (!carousel.options.loop) return;
		var clones = document.createDocumentFragment();
		for (var i = init; i < nb + init; i++) {
			var index = getIndex(carousel, carousel.selectedItem + carousel.visibItemsNb + i),
				clone = carousel.initItems[index].cloneNode(true);
			clone.classList.add('is-cloned');
			clones.appendChild(clone);
		}
		carousel.list.appendChild(clones);
		emitCarouselUpdateEvent(carousel);
	}

	function removeClones(carousel, index, bool) {
		if (!carousel.options.loop) return;
		if (!bool) {
			bool = carousel.visibItemsNb;
		}
		for (var i = 0; i < bool; i++) {
			if (carousel.items[index]) carousel.list.removeChild(carousel.items[index]);
		}
	}

	function resetCarouselResize(carousel) {
		var visibleItems = carousel.visibItemsNb;
		resetItemAutoSize(carousel);
		initCarouselLayout(carousel);
		setItemsWidth(carousel, false);
		resetItemsWidth(carousel);
		if (carousel.options.loop) {
			if (visibleItems > carousel.visibItemsNb) {
				removeClones(carousel, 0, visibleItems - carousel.visibItemsNb);
			} else if (visibleItems < carousel.visibItemsNb) {
				insertBefore(carousel, carousel.visibItemsNb, visibleItems);
			}
			updateCarouselClones(carousel);
		} else {
			var translate = noLoopTranslateValue(carousel);
			setTranslate(carousel, 'translateX(' + translate + ')');
		}
		resetItemsTabIndex(carousel);
	}

	function resetItemAutoSize(carousel) {
		if (!cssPropertiesSupported) return;
		carousel.items[0].removeAttribute('style');
		carousel.itemAutoSize = getComputedStyle(carousel.items[0]).getPropertyValue('width');
	}

	function resetItemsWidth(carousel) {
		for (var i = 0; i < carousel.initItems.length; i++) {
			carousel.initItems[i].style.width = carousel.itemsWidth + 'px';
		}
	}

	function resetItemsTabIndex(carousel) {
		var carouselActive = carousel.items.length > carousel.visibItemsNb;
		var j = carousel.items.length;
		for (var i = 0; i < carousel.items.length; i++) {
			if (carousel.options.loop) {
				if (i < carousel.visibItemsNb || i >= 2 * carousel.visibItemsNb) {
					carousel.items[i].setAttribute('tabindex', '-1');
				} else {
					if (i < j) j = i;
					carousel.items[i].removeAttribute('tabindex');
				}
			} else {
				if ((i < carousel.selectedItem || i >= carousel.selectedItem + carousel.visibItemsNb) && carouselActive) {
					carousel.items[i].setAttribute('tabindex', '-1');
				} else {
					if (i < j) j = i;
					carousel.items[i].removeAttribute('tabindex');
				}
			}
		}
		resetVisibilityOverflowItems(carousel, j);
	}

	function startAutoplay(carousel) {
		if (carousel.options.autoplay && !carousel.autoplayId && !carousel.autoplayPaused) {
			carousel.autoplayId = setInterval(function () {
				showNextItems(carousel);
			}, carousel.options.autoplayInterval);
		}
	}

	function pauseAutoplay(carousel) {
		if (carousel.options.autoplay) {
			clearInterval(carousel.autoplayId);
			carousel.autoplayId = false;
		}
	}

	function initAriaLive(carousel) {
		if (!carousel.options.ariaLive) return;
		var srLiveArea = document.createElement('div');
		srLiveArea.setAttribute('class', 'visually-hidden carousel__aria-live');
		srLiveArea.setAttribute('aria-live', 'polite');
		srLiveArea.setAttribute('aria-atomic', 'true');
		carousel.element.appendChild(srLiveArea);
		carousel.ariaLive = srLiveArea;
	}

	function updateAriaLive(carousel) {
		if (!carousel.options.ariaLive) return;
		carousel.ariaLive.innerHTML = 'Item ' + (carousel.selectedItem + 1) + ' selected. ' + carousel.visibItemsNb + ' items of ' + carousel.initItems.length + ' visible';
	}

	function getIndex(carousel, index) {
		if (index < 0) index = getPositiveValue(index, carousel.itemsNb);
		if (index >= carousel.itemsNb) index = index % carousel.itemsNb;
		return index;
	}

	function getPositiveValue(value, add) {
		value = value + add;
		if (value > 0) return value;
		else return getPositiveValue(value, add);
	}

	function setTranslate(carousel, translate) {
		carousel.list.style.transform = translate;
		carousel.list.style.msTransform = translate;
	}

	function getCarouselWidth(carousel, computedWidth) {
		var closestHidden = carousel.listWrapper.closest('.visually-hidden');
		if (closestHidden) {
			closestHidden.classList.remove('visually-hidden');
			computedWidth = carousel.listWrapper.offsetWidth;
			closestHidden.classList.add('visually-hidden');
		} else if (isNaN(computedWidth)) {
			computedWidth = getHiddenParentWidth(carousel.element, carousel);
		}
		return computedWidth;
	}

	function getHiddenParentWidth(element, carousel) {
		var parent = element.parentElement;
		if (parent.tagName.toLowerCase() == 'html') return 0;
		var style = window.getComputedStyle(parent);
		if (style.display == 'none' || style.visibility == 'hidden') {
			parent.setAttribute('style', 'display: block!important; visibility: visible!important;');
			var computedWidth = carousel.listWrapper.offsetWidth;
			parent.style.display = '';
			parent.style.visibility = '';
			return computedWidth;
		} else {
			return getHiddenParentWidth(parent, carousel);
		}
	}

	function resetCarouselControls(carousel) {
		if (carousel.options.loop) return;
		if (carousel.controls.length > 0) {
			carousel.totTranslate == 0 ? carousel.controls[0].setAttribute('disabled', true) : carousel.controls[0].removeAttribute('disabled');
			carousel.totTranslate == -carousel.translateContainer - carousel.containerWidth || carousel.items.length <= carousel.visibItemsNb ? carousel.controls[1].setAttribute('disabled', true) : carousel.controls[1].removeAttribute('disabled');
		}
		if (carousel.options.nav) {
			var selectedDot = carousel.navigation.getElementsByClassName(carousel.options.navigationItemClass + '--is-selected');
			if (selectedDot.length > 0) selectedDot[0].classList.remove(carousel.options.navigationItemClass + '--is-selected');
			var newSelectedIndex = getSelectedDot(carousel);
			if (carousel.totTranslate == -carousel.translateContainer - carousel.containerWidth) {
				newSelectedIndex = carousel.navDots.length - 1;
			}
			carousel.navDots[newSelectedIndex].classList.add(carousel.options.navigationItemClass + '--is-selected');
		}
		carousel.totTranslate == 0 && (carousel.totTranslate == -carousel.translateContainer - carousel.containerWidth || carousel.items.length <= carousel.visibItemsNb) ? carousel.element.classList.add('carousel--hide-controls') : carousel.element.classList.remove('carousel--hide-controls');
	}

	function emitCarouselUpdateEvent(carousel) {
		carousel.cloneList = [];
		var clones = carousel.element.querySelectorAll('.is-cloned');
		for (var i = 0; i < clones.length; i++) {
			clones[i].classList.remove('is-cloned');
			carousel.cloneList.push(clones[i]);
		}
		emitCarouselEvents(carousel, 'carousel-updated', carousel.cloneList);
	}

	function carouselCreateNavigation(carousel) {
		if (carousel.element.getElementsByClassName('carousel__pagination').length > 0) return;
		var navigation = document.createElement('ol'),
			navChildren = '';
		var navClasses = carousel.options.navigationClass;
		if (carousel.items.length <= carousel.visibItemsNb) {
			navClasses = navClasses + ' is-hidden';
		}
		navigation.setAttribute('class', navClasses);
		var dotsNr = Math.ceil(carousel.items.length / carousel.visibItemsNb),
			selectedDot = getSelectedDot(carousel),
			indexClass = carousel.options.navigationPagination ? '' : 'visually-hidden';
		for (var i = 0; i < dotsNr; i++) {
			var className = i == selectedDot ? 'class="' + carousel.options.navigationItemClass + ' ' + carousel.options.navigationItemClass + '--is-selected"' : 'class="' + carousel.options.navigationItemClass + '"';
			navChildren = navChildren + '<li ' + className + '><button class="button carousel__pagination-button" type="button"><span class="visually-hidden">' + (i + 1) + '</span></button></li>';
		}
		navigation.innerHTML = navChildren;
		carousel.element.appendChild(navigation);
	}

	function carouselInitNavigationEvents(carousel) {
		carousel.navigation = carousel.element.getElementsByClassName('carousel__pagination')[0];
		carousel.navDots = carousel.element.getElementsByClassName('carousel__pagination-item');
		carousel.navIdEvent = carouselNavigationClick.bind(carousel);
		carousel.navigation.addEventListener('click', carousel.navIdEvent);
	}

	function carouselRemoveNavigation(carousel) {
		if (carousel.navigation) carousel.element.removeChild(carousel.navigation);
		if (carousel.navIdEvent) carousel.navigation.removeEventListener('click', carousel.navIdEvent);
	}

	function resetDotsNavigation(carousel) {
		if (!carousel.options.nav) return;
		carouselRemoveNavigation(carousel);
		carouselCreateNavigation(carousel);
		carouselInitNavigationEvents(carousel);
	}

	function carouselNavigationClick(event) {
		var dot = event.target.closest('.carousel__pagination-item');
		if (!dot) return;
		if (this.animating) return;
		this.animating = true;
		var index = Array.prototype.indexOf.call(this.navDots, dot);
		this.selectedDotIndex = index;
		this.selectedItem = index * this.visibItemsNb;
		animateList(this, false, 'click');
	}

	function getSelectedDot(carousel) {
		return Math.ceil(carousel.selectedItem / carousel.visibItemsNb);
	}

	function initCarouselCounter(carousel) {
		if (carousel.counterTor.length > 0) carousel.counterTor[0].textContent = carousel.itemsNb;
		setCounterItem(carousel);
	}

	function setCounterItem(carousel) {
		if (carousel.counter.length == 0) return;
		var totalItems = carousel.selectedItem + carousel.visibItemsNb;
		if (totalItems > carousel.items.length) totalItems = carousel.items.length;
		carousel.counter[0].textContent = totalItems;
	}

	function centerItems(carousel) {
		if (!carousel.options.justifyContent) return;
		carousel.list.classList.toggle('justify-center', carousel.items.length < carousel.visibItemsNb);
	}

	function alignControls(carousel) {
		if (carousel.controls.length < 1 || !carousel.options.alignControls) return;
		if (!carousel.controlsAlignEl) {
			carousel.controlsAlignEl = carousel.element.querySelector(carousel.options.alignControls);
		}
		if (!carousel.controlsAlignEl) return;
		var translate = carousel.element.offsetHeight - carousel.controlsAlignEl.offsetHeight;
		for (var i = 0; i < carousel.controls.length; i++) {
			carousel.controls[i].style.marginBottom = translate + 'px';
		}
	}

	function emitCarouselActiveItemsEvent(carousel) {
		emitCarouselEvents(carousel, 'carousel-active-items', {
			firstSelectedItem: carousel.selectedItem,
			visibleItemsNb: carousel.visibItemsNb,
		});
	}

	function emitCarouselEvents(carousel, eventName, eventDetail) {
		var event = new CustomEvent(eventName, {
			detail: eventDetail,
		});
		carousel.element.dispatchEvent(event);
	}

	function resetVisibilityOverflowItems(carousel, j) {
		if (!carousel.options.overflowItems) return;
		var itemWidth = carousel.containerWidth / carousel.items.length,
			delta = (window.innerWidth - itemWidth * carousel.visibItemsNb) / 2,
			overflowItems = Math.ceil(delta / itemWidth);
		for (var i = 0; i < overflowItems; i++) {
			var indexPrev = j - 1 - i;
			if (indexPrev >= 0) carousel.items[indexPrev].removeAttribute('tabindex');
			var indexNext = j + carousel.visibItemsNb + i;
			if (indexNext < carousel.items.length) carousel.items[indexNext].removeAttribute('tabindex');
		}
	}
	var extendProps = function () {
		var extended = {};
		var deep = false;
		var i = 0;
		var length = arguments.length;
		if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
			deep = arguments[0];
			i++;
		}
		var merge = function (obj) {
			for (var prop in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, prop)) {
					if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
						extended[prop] = extend(true, extended[prop], obj[prop]);
					} else {
						extended[prop] = obj[prop];
					}
				}
			}
		};
		for (; i < length; i++) {
			var obj = arguments[i];
			merge(obj);
		}
		return extended;
	};
	Carousel.defaults = {
		element: '',
		autoplay: false,
		autoplayOnHover: false,
		autoplayOnFocus: false,
		autoplayInterval: 4000,
		loop: true,
		nav: false,
		navigationItemClass: 'carousel__pagination-item',
		navigationClass: 'carousel__pagination',
		navigationPagination: false,
		justifyContent: false,
		alignControls: false,
		overflowItems: false,
	};
	window.Carousel = Carousel;
	var carousels = document.getElementsByClassName('carousel--is-initialized'),
		flexSupported = CSS.supports('align-items', 'stretch'),
		transitionSupported = CSS.supports('transition', 'transform'),
		cssPropertiesSupported = 'CSS' in window && CSS.supports('color', 'var(--color-var)');
	if (carousels.length > 0) {
		for (var i = 0; i < carousels.length; i++) {
			(function (i) {
				var autoplay = carousels[i].getAttribute('data-autoplay') && carousels[i].getAttribute('data-autoplay') == 'on' ? true : false,
					autoplayInterval = carousels[i].getAttribute('data-autoplay-interval') ? carousels[i].getAttribute('data-autoplay-interval') : 4000,
					autoplayOnHover = carousels[i].getAttribute('data-autoplay-hover') && carousels[i].getAttribute('data-autoplay-hover') == 'on' ? true : false,
					autoplayOnFocus = carousels[i].getAttribute('data-autoplay-focus') && carousels[i].getAttribute('data-autoplay-focus') == 'on' ? true : false,
					loop = carousels[i].getAttribute('data-loop') && carousels[i].getAttribute('data-loop') == 'off' ? false : true,
					nav = carousels[i].getAttribute('data-navigation') && carousels[i].getAttribute('data-navigation') == 'on' ? true : false,
					navigationItemClass = carousels[i].getAttribute('data-navigation-item-class') ? carousels[i].getAttribute('data-navigation-item-class') : 'carousel__pagination-item',
					navigationClass = carousels[i].getAttribute('data-navigation-class') ? carousels[i].getAttribute('data-navigation-class') : 'carousel__pagination',
					navigationPagination = carousels[i].getAttribute('data-navigation-pagination') && carousels[i].getAttribute('data-navigation-pagination') == 'on' ? true : false,
					overflowItems = carousels[i].getAttribute('data-overflow-items') && carousels[i].getAttribute('data-overflow-items') == 'on' ? true : false,
					alignControls = carousels[i].getAttribute('data-align-controls') ? carousels[i].getAttribute('data-align-controls') : false,
					justifyContent = carousels[i].getAttribute('data-justify-content') && carousels[i].getAttribute('data-justify-content') == 'on' ? true : false;
				new Carousel({
					element: carousels[i],
					autoplay: autoplay,
					autoplayOnHover: autoplayOnHover,
					autoplayOnFocus: autoplayOnFocus,
					autoplayInterval: autoplayInterval,
					ariaLive: true,
					loop: loop,
					nav: nav,
					navigationItemClass: navigationItemClass,
					navigationPagination: navigationPagination,
					navigationClass: navigationClass,
					overflowItems: overflowItems,
					justifyContent: justifyContent,
					alignControls: alignControls,
				});
			})(i);
		}
	}
}
