const participants = [
	{
		name: 'Хозе-Рауль Капабланка',
		description: 'Чемпион мира по шахматам',
		photo: 'person.png',
		link: '#',
	},
	{
		name: 'Эммануил Ласкер',
		description: 'Чемпион мира по шахматам',
		photo: 'person.png',
		link: '#',
	},
	{
		name: 'Александр Алехин',
		description: 'Чемпион мира по шахматам',
		photo: 'person.png',
		link: '#',
	},
	{
		name: 'Арон Нимцович',
		description: 'Чемпион мира по шахматам',
		photo: 'person.png',
		link: '#',
	},
	{
		name: 'Рихард Рети',
		description: 'Чемпион мира по шахматам',
		photo: 'person.png',
		link: '#',
	},
	{
		name: 'Остап Бендер',
		description: 'Гроссмейстер',
		photo: 'person.png',
		link: '#',
	},
];

const participantTemplate = (participant) => `
	<li class="participants__item">
		<div class="person-card">
			<figure class="person-card__figure">
				<img alt="Фотография шахматиста" class="person-card__image" src="${participant.photo}" />
			</figure>
			<div class="person-card__name">${participant.name}</div>
			<div class="person-card__text">${participant.description}</div>
			<div class="person-card__actions">
				<a class="button person-card__link" href="${participant.link}">Подробнее</a>
			</div>
		</div>
	</li>
`;

const generateMarkup = (participants) => {
	return participants.map(participantTemplate).join('');
};

const participantsList = document.querySelector('.participants__list');

const renderParticipants = (participants, element) => {
	if (element) {
		element.innerHTML = generateMarkup(participants);
	}
};

renderParticipants(participants, participantsList);
