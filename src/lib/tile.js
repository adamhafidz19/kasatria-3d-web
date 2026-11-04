export function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function createSpan(className, text) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
}

export function createTile(person) {
  const element = document.createElement('div');
  element.className = `element tier-${person.tier}`;
  element.dataset.tier = person.tier;
  element.setAttribute(
    'aria-label',
    `${person.name}, age ${person.age}, ${person.country}, ${person.interest}, net worth ${person.netWorthFormatted}`
  );
  element.title = [
    person.name,
    `Age: ${person.age}`,
    `Country: ${person.country}`,
    `Interest: ${person.interest}`,
    `Net worth: ${person.netWorthFormatted}`,
  ].join('\n');

  const top = document.createElement('div');
  top.className = 'element-top';
  top.append(
    createSpan('element-country', person.country),
    createSpan('element-age', person.age)
  );

  const photoFrame = document.createElement('div');
  photoFrame.className = 'element-photo';
  photoFrame.appendChild(
    createSpan('element-initials', getInitials(person.name))
  );

  if (person.photo) {
    const image = document.createElement('img');
    image.src = person.photo;
    image.alt = '';
    image.decoding = 'async';
    image.draggable = false;
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('load', () => image.classList.add('is-loaded'), {
      once: true,
    });
    image.addEventListener('error', () => image.remove(), { once: true });
    photoFrame.appendChild(image);
  }

  const name = document.createElement('div');
  name.className = 'element-name';
  name.textContent = person.name;

  const interest = document.createElement('div');
  interest.className = 'element-interest';
  interest.textContent = person.interest;

  element.append(top, photoFrame, name, interest);
  return element;
}
