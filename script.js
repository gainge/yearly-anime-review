const RANKINGS_DIR = './rankings';
const OPENINGS_JSON_FILE = 'openings.json';
const OLD_FULL_OPENINGS_JSON_FILE = './rankings/openings.json';
const LINK_ICON = './res/foreign.png';
const YEAR_QUERY_PARAM = 'year';
const VALID_YEARS = [2021, 2022, 2023, 2024, 2025];
const DEFAULT_YEAR = VALID_YEARS[VALID_YEARS.length - 1];
const DEFAULT_MARQUEE_SPEED = 0.20; // px per frame

let marqueeAnimationFrame = undefined;
let marqueeSpeed = DEFAULT_MARQUEE_SPEED;

function parseYear(rawYear) {
  const parsedYear = parseInt(rawYear);

  if (parsedYear && VALID_YEARS.includes(parsedYear)) {
    return parsedYear;
  } else {
    return DEFAULT_YEAR;
  }
}

function getRankingYear() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawQueryYear = urlParams.get(YEAR_QUERY_PARAM);
  return parseYear(rawQueryYear);
}

document.addEventListener('DOMContentLoaded', (event) => {
  // Initialize video default volume
  const video = document.getElementById('opening-video');
  video.volume = 0.5;
  // Pull year from query param and load json file
  const initialYear = getRankingYear();
  const select = document.getElementById('year-select');
  select.value = `${initialYear}`;
  loadYear(initialYear);
});

function loadYear(year) {
  if (!VALID_YEARS.includes(year)) {
    alert(`No rankings available for year: ${year}`)
    return;
  }

  fetch(`${RANKINGS_DIR}/${year}/${OPENINGS_JSON_FILE}`)
    .then(response => response.json())
    .then(json => buildRankings(json));
}


function yearSelected(selectObject) {
  const year = parseYear(selectObject.value);
  loadYear(year);
}

function stopMarquee() {
  marqueeSpeed = 0;
}

function resumeMarquee() {
  marqueeSpeed = DEFAULT_MARQUEE_SPEED;
}

function playVideo(url) {
  // Set the player source and show
  const modal = document.getElementById('modal');
  const video = document.getElementById('opening-video');
  const source = document.getElementById('video-source');
  
  source.setAttribute('src', url);
  video.load();
  
  modal.style.display = 'inherit';
  video.style.display = 'inherit';

  stopMarquee();
}

function stopVideo() {
  console.log('closing video');
  const modal = document.getElementById('modal');
  const video = document.getElementById('opening-video');

  video.pause();

  modal.style.display = 'none';
  video.style.display = 'none';

  resumeMarquee();
}

function onModalClick() {
  stopVideo();
}


function getRankingParentElement() {
  return document.getElementById('opening-ranking');
}

function getAwardsParentElement() {
  return document.getElementById('awards');
}

function getMarqueeTrackElement() {
  return document.getElementById('cover-marquee-track');
}

function clearRankings() {
  const rankingParent = getRankingParentElement();
  rankingParent.innerHTML = '';

  const awardsParent = getAwardsParentElement();
  awardsParent.innerHTML = '';
}

function clearMarquee() {
  if (marqueeAnimationFrame) {
    cancelAnimationFrame(marqueeAnimationFrame);
    marqueeAnimationFrame = undefined;
    const marqueeTrack = getMarqueeTrackElement();
    marqueeTrack.innerHTML = '';
    marqueeTrack.style.opacity = 0;
    marqueeTrack.classList.remove('animated-fade-in');
  }
}

function buildRankings(json) {
  console.log(json);
  clearMarquee();
  clearRankings();
  // Let's just spit it out real quick
  const rankingParent = getRankingParentElement();

  // Write out the tiers
  const tiers = json.tiers;
  const openings = json.openings;
  const ranking = json.ranking;
  const awards = json.awards;


  let colors = [];
  let colorIndices = [];

  tiers.forEach(tierData => {
    let tier = document.createElement('p');

    tier.classList.add('tier');

    tier.innerHTML = tierData.label;
    tier.style.backgroundColor = tierData.color;
    tier.style.gridColumnStart = 1;
    tier.style.gridColumnEnd = 2;
    tier.style.gridRowStart = tierData.low;
    tier.style.gridRowEnd = tierData.high;

    rankingParent.appendChild(tier);

    // Store the colors to use for rank numbers
    colors.push(tierData.color);
    colorIndices.push(tierData.high);
  });



  // Write out the awards!
  const awardsParent = getAwardsParentElement();

  awards.forEach(award => {
    let container = document.createElement('div');
    container.classList.add('award-item');

    // Spin out the label
    let label = document.createElement('p');
    label.innerHTML = award.award;
    label.classList.add('award-title')

    let op = document.createElement('a');
    op.classList.add('award-op')
    let opening = openings[award.index]
    op.innerHTML = opening.name;

    if (opening.showURL.indexOf('youtu') >= 0) {
      op.onclick = () => window.open(opening.showURL, '_blank').focus();
    } else {
      op.onclick = () => playVideo(opening.link);
    }
    
    container.appendChild(label);
    container.appendChild(op);

    awardsParent.appendChild(container);
  });

  const coverImages = openings.map(op => op.coverImage).filter(url => url && url.length > 0);
  // Shuffle the images
  for (let i = coverImages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [coverImages[i], coverImages[j]] = [coverImages[j], coverImages[i]];
  }

  // Construct cover marquee
  const marqueeTrack = getMarqueeTrackElement();
  const slotWidth = 135; // px, 125 image + 10 gap

  // Figure out how many images we need to fill the screen + buffer
  const parentWidth = marqueeTrack.parentElement.clientWidth;
  const numImages = Math.ceil(parentWidth / slotWidth) + 2;
  console.log(`Marquee parent width: ${parentWidth}, num images: ${numImages}`);

  const activeSlots = [];
  let headIndex = 0;
  // let offset = parentWidth; // Start just offscreen to the right
  let offset = 0; // Start fully onscreen

  // Initialize first set of images
  for (let i = 0; i < numImages; i++) {
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('marquee-image-container');
    const img = document.createElement('img');
    img.setAttribute('src', coverImages[i % coverImages.length]);
    img.classList.add('marquee-image');
    imageContainer.appendChild(img);
    marqueeTrack.appendChild(imageContainer);
    activeSlots.push(imageContainer);
  }

  // Fade in the marquee
  marqueeTrack.classList.add('animated-fade-in');
  
  function updateMarquee() {
    offset -= marqueeSpeed;

    if (offset <= -slotWidth) {
      const firstSlot = activeSlots.shift();
      activeSlots.push(firstSlot);
      marqueeTrack.appendChild(firstSlot);
      // Reset track position to emulate infinite scroll
      offset += slotWidth;

      // Update content of the recycled image
      headIndex = (headIndex + 1) % coverImages.length;
      const nextImageIndex = (headIndex + numImages - 1) % coverImages.length;
      firstSlot.querySelector('img').setAttribute('src', coverImages[nextImageIndex]);
    }

    // Apply transform to marquee track
    marqueeTrack.style.transform = `translateX(${offset}px)`;
    marqueeAnimationFrame = requestAnimationFrame(updateMarquee);
  }

  marqueeAnimationFrame = requestAnimationFrame(updateMarquee);


  colorIndices.push(1000000);

  console.log(colorIndices);

  colors.reverse()
  colorIndices.reverse();

  // Now we have to actually spit out the shows eh?

  let currentTierColor = colors.pop() || '#FF00FF';
  let nextColorIndex = colorIndices.pop() || 10000000;

  ranking.forEach((ID, rank) => {
    // Check for color update
    if (rank + 1 >= nextColorIndex) {
      currentTierColor = colors.pop() || '#FF00FF';
      nextColorIndex = colorIndices.pop() || 10000000;
    }

    let opening = openings[ID];
    console.log(opening);

    let openingItem = document.createElement('div');
    openingItem.classList.add('ranking-item');
    // TODO: maybe need to set item style?

    // Add the rank
    let rankSpan = document.createElement('p');
    rankSpan.innerHTML = `${rank + 1}`;
    rankSpan.classList.add('rank-index');
    rankSpan.style.backgroundColor = currentTierColor;

    openingItem.appendChild(rankSpan);

    // Add the OP detail
    let openingDetail = document.createElement('p');
    openingDetail.innerHTML = opening.name;
    if (opening.link.indexOf('youtu') >= 0) {
      openingDetail.onclick = () => window.open(opening.link, '_blank').focus();
    } else {
      openingDetail.onclick = () => playVideo(opening.link);
    }
    openingDetail.classList.add('op-title');

    openingItem.appendChild(openingDetail);


    // Add the show link icon
    let showLink = document.createElement('a');
    showLink.setAttribute('href', opening.showURL || 'https://www.youtube.com/channel/UCO_aKKYxn4tvrqPjcTzZ6EQ');
    showLink.setAttribute('target', '_blank')

    let linkIcon = document.createElement('img');
    linkIcon.setAttribute('src', LINK_ICON);
    linkIcon.classList.add('link-icon');

    showLink.appendChild(linkIcon);

    openingItem.appendChild(showLink);

    // Finally add the parent
    rankingParent.appendChild(openingItem);
  });
}




