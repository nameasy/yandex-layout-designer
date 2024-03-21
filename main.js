import './styles/index.css';
import { initializeCarousel } from './carousel.js';

document.addEventListener('DOMContentLoaded', () => {
	const featuresSection = document.querySelector('.features');
	const introButton = document.querySelector('.intro__button--primary');
	const stagesCarousel = document.querySelector('.stages__carousel');
	const originalMarkup = stagesCarousel.cloneNode(true);

	if (featuresSection && introButton) {
		introButton.addEventListener('click', (event) => {
			event.preventDefault();
			featuresSection.scrollIntoView({
				behavior: 'smooth',
			});
		});
	}

	const handleScreenWidthChange = () => {
		const isMobile = window.innerWidth <= 375;
		if (isMobile) {
			stagesCarousel.classList.add('carousel--is-initialized');
			initializeCarousel();
		} else {
			stagesCarousel.classList.remove('carousel--is-initialized');
			stagesCarousel.innerHTML = originalMarkup.innerHTML;
		}
	}

	handleScreenWidthChange();
	initializeCarousel();
	window.addEventListener('resize', handleScreenWidthChange);
});
