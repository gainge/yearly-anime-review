const OPENINGS_JSON_FILE = './rankings/openings.json';
const LINK_ICON = './res/foreign.png';

fetch(OPENINGS_JSON_FILE)
  .then(response => response.json())
  .then(json => buildRankings(json));

// Aight let's do it


function playVideo(url) {
  // Set the player source and show
  let modal = document.getElementById('modal');
  let video = document.getElementById('opening-video');
  let source = document.getElementById('video-source');

  source.setAttribute('src', url);
  video.load();

  modal.style.display = 'inherit';
  video.style.display = 'inherit';

  // TODO: might have to do something with the playback position here? start from 0?
}

function onModalClick() {
  console.log('closing video');

  let modal = document.getElementById('modal');
  let video = document.getElementById('opening-video');

  video.pause();

  modal.style.display = 'none';
  video.style.display = 'none';
}


function buildRankings(json) {
  console.log(json);
  // Let's just spit it out real quick
  const rankingParent = document.getElementById('opening-ranking');

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
  const awardsParent = document.getElementById('awards');

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
    op.onclick = () => playVideo(opening.link);
    // op.setAttribute('href', );

    container.appendChild(label);
    container.appendChild(op);

    awardsParent.appendChild(container);
  });




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
    openingDetail.onclick = () => playVideo(opening.link);
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




