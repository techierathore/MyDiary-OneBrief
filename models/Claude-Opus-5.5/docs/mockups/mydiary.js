/* MyDiary mockups — makes the controls behave the way the built app will.
   Navigation never uses this file: every link is a plain <a href>.
   Without scripts each screen still shows its drawn state.
   - msg(text): the message a non-navigating button gives (ToastService in the app)
   - theme: Light / Dark / System from Settings, kept for every mockup page
   - toggles, toggle groups, switches, radio cards, checkboxes, star
   - select drop-downs, tabs, calendar days, tag chips */

/* ---------- theme (runs before the page is drawn, so there is no flash) ---------- */
var THEME_KEY = 'mydiary-mockup-theme';
function storedTheme() { try { return localStorage.getItem(THEME_KEY) || 'system'; } catch (e) { return 'system'; } }
function applyTheme(choice) {
  var dark = choice === 'dark' || (choice === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}
function setTheme(choice) {
  try { localStorage.setItem(THEME_KEY, choice); } catch (e) { /* private window: this page only */ }
  applyTheme(choice);
}
applyTheme(storedTheme());
if (window.matchMedia) {
  var mq = matchMedia('(prefers-color-scheme: dark)');
  var onSystemChange = function () { if (storedTheme() === 'system') applyTheme('system'); };
  if (mq.addEventListener) mq.addEventListener('change', onSystemChange); else if (mq.addListener) mq.addListener(onSystemChange);
}

/* ---------- message ---------- */
function msg(text) {
  var host = document.querySelector('.toast-host');
  if (!host) { host = document.createElement('div'); host.className = 'toast-host'; document.body.appendChild(host); }
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  host.appendChild(t);
  setTimeout(function () { t.remove(); }, 2600);
  return false;
}

function labelOf(el) { return (el.textContent || '').trim() || el.title || el.getAttribute('aria-label') || ''; }

/* The label of the chosen toggle in the group named `name` (data-name on the group). */
function shown(name) {
  var on = document.querySelector('.toggle-group[data-name="' + name + '"] .toggle.on');
  return on ? labelOf(on) : '';
}
function refreshShown(name) {
  var text = shown(name);
  document.querySelectorAll('[data-show="' + name + '"]').forEach(function (s) { s.textContent = text; });
}

/* ---------- toggles and the star: onclick="return pick(this)" ---------- */
function pick(el) {
  if (el.classList.contains('toggle')) {
    var group = el.closest('.toggle-group');
    var multiple = !group || group.hasAttribute('data-multiple');
    if (multiple) {
      el.classList.toggle('on');
    } else {
      group.querySelectorAll('.toggle').forEach(function (t) { t.classList.remove('on'); t.setAttribute('aria-pressed', 'false'); });
      el.classList.add('on');
    }
    var isOn = el.classList.contains('on');
    el.setAttribute('aria-pressed', String(isOn));
    if (el.dataset.themeSet) { setTheme(el.dataset.themeSet); }
    if (group && group.dataset.name) refreshShown(group.dataset.name);
    if (multiple) msg(labelOf(el) + (isOn ? ' on' : ' off'));
    else msg(el.dataset.msg || (labelOf(el) + ' selected'));
    return false;
  }
  if (el.hasAttribute('aria-pressed')) {
    var pressed = el.getAttribute('aria-pressed') !== 'true';
    el.setAttribute('aria-pressed', String(pressed));
    el.classList.toggle('star-on', pressed);
    var icon = el.querySelector('.i');
    if (icon) { icon.classList.toggle('i-star-fill', pressed); icon.classList.toggle('i-star', !pressed); }
    el.setAttribute('aria-label', pressed ? 'Starred' : 'Not starred');
    msg(pressed ? (el.dataset.msgOn || 'Starred') : (el.dataset.msgOff || 'Star removed'));
    return false;
  }
  return false;
}

/* ---------- tag chips ---------- */
function untag(btn) {
  var chip = btn.closest('.badge');
  var name = chip ? chip.firstChild.textContent.trim() : 'Tag';
  if (chip) chip.remove();
  return msg('Tag "' + name + '" removed');
}
function addTag(input) {
  var name = input.value.trim();
  if (!name) return;
  var chip = document.createElement('span');
  chip.className = 'badge badge-secondary';
  chip.appendChild(document.createTextNode(name + ' '));
  var x = document.createElement('button');
  x.type = 'button';
  x.className = 'chip-remove';
  x.setAttribute('aria-label', 'Remove ' + name);
  x.textContent = '×';
  x.onclick = function () { return untag(x); };
  chip.appendChild(x);
  input.parentNode.insertBefore(chip, input);
  input.value = '';
  msg('Tag "' + name + '" added');
}

/* ---------- switches, radio cards, checkboxes ---------- */
function flipSwitch(sw) {
  var on = !sw.classList.contains('on');
  sw.classList.toggle('on', on);
  sw.setAttribute('aria-checked', String(on));
  var row = sw.closest('.setting-row');
  var title = row && row.querySelector('.t');
  msg((title ? title.textContent.trim() : 'Setting') + (on ? ': on' : ': off'));
}
function chooseRadio(card) {
  if (card.classList.contains('locked')) { msg('Needs a paid licence'); return; }
  var group = card.closest('[role="radiogroup"]') || card.parentNode;
  group.querySelectorAll('.radio-card').forEach(function (c) {
    c.classList.remove('selected'); c.setAttribute('aria-checked', 'false');
    var r = c.querySelector('.radio'); if (r) r.classList.remove('on');
  });
  card.classList.add('selected');
  card.setAttribute('aria-checked', 'true');
  var radio = card.querySelector('.radio'); if (radio) radio.classList.add('on');
}
function selectedRadioTitle(groupTestId) {
  var t = document.querySelector('[data-testid="' + groupTestId + '"] .radio-card.selected .t');
  return t ? t.textContent.trim() : '';
}

/* ---------- select drop-downs ---------- */
function openSelect(sel, open) {
  var content = sel.querySelector('.select-content');
  if (!content) return;
  content.hidden = !open;
  var trigger = sel.querySelector('.select-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', String(open));
}
function chooseItem(item) {
  var sel = item.closest('.select');
  sel.querySelectorAll('.select-item').forEach(function (i) { i.classList.remove('selected'); i.setAttribute('aria-selected', 'false'); });
  item.classList.add('selected');
  item.setAttribute('aria-selected', 'true');
  var trigger = sel.querySelector('.select-trigger');
  if (trigger) trigger.textContent = item.textContent.trim();
  openSelect(sel, false);
}

/* ---------- tabs: a trigger whose href is #panel shows that panel and hides its siblings' ---------- */
function showTab(trigger) {
  var list = trigger.closest('.tabs-list');
  list.querySelectorAll('.tabs-trigger').forEach(function (t) {
    var on = t === trigger;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', String(on));
    var panel = document.getElementById((t.getAttribute('href') || '').slice(1));
    if (panel) {
      panel.hidden = !on;
      if (panel.parentNode.classList.contains('grid-2')) panel.parentNode.classList.add('tabbed');
    }
  });
}

/* ---------- calendar ---------- */
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function chooseDay(day) {
  var cal = day.closest('.calendar');
  cal.querySelectorAll('.day.selected').forEach(function (d) { d.classList.remove('selected'); });
  day.classList.add('selected');
  var head = cal.querySelector('[data-testid="calendar-month"]');
  var parts = head ? head.textContent.trim().split(' ') : [];
  var month = MONTHS.indexOf(parts[0]);
  var n = parseInt(day.textContent, 10);
  var heading = document.querySelector('[data-testid="calendar-day-heading"]');
  if (heading && month >= 0) {
    var date = new Date(parseInt(parts[1], 10), month, n);
    heading.textContent = DAYS[date.getDay()] + ' ' + n + ' ' + MONTHS[month];
  }
  if (!heading) return;
  var has = day.classList.contains('has');
  var el = heading.nextElementSibling;
  while (el && el.classList.contains('item')) { el.hidden = !has; el = el.nextElementSibling; }
  var none = document.querySelector('.calendar-none');
  if (!none) {
    none = document.createElement('p');
    none.className = 'small muted calendar-none';
    none.textContent = 'No entries on this day.';
    heading.parentNode.insertBefore(none, heading.nextSibling);
  }
  none.hidden = has;
}

/* ---------- wiring ---------- */
function activate(target) {
  var el;
  if ((el = target.closest('.switch'))) { flipSwitch(el); return true; }
  if ((el = target.closest('.radio-card'))) { chooseRadio(el); return true; }
  if ((el = target.closest('.select-item'))) { chooseItem(el); return true; }
  if ((el = target.closest('.select-trigger'))) {
    var sel = el.closest('.select');
    openSelect(sel, sel.querySelector('.select-content').hidden);
    return true;
  }
  if ((el = target.closest('.calendar-grid .day:not(.out)'))) { chooseDay(el); return true; }
  if ((el = target.closest('.checkbox')) || ((el = target.closest('label')) && (el = el.querySelector('.checkbox')))) {
    var checked = !el.classList.contains('checked');
    el.classList.toggle('checked', checked);
    el.setAttribute('aria-checked', String(checked));
    return true;
  }
  if ((el = target.closest('.badge .i-x'))) {
    var chip = el.closest('.badge');
    msg('Tag "' + chip.textContent.trim() + '" removed');
    chip.remove();
    return true;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', function () {
  var choice = storedTheme();
  document.querySelectorAll('[data-theme-set]').forEach(function (b) {
    var on = b.dataset.themeSet === choice;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });

  document.querySelectorAll('.switch').forEach(function (s) { s.tabIndex = 0; });
  document.querySelectorAll('.radio-card').forEach(function (c) {
    c.tabIndex = 0; c.setAttribute('role', 'radio');
    c.setAttribute('aria-checked', String(c.classList.contains('selected')));
  });
  document.querySelectorAll('.select-trigger').forEach(function (t) { t.tabIndex = 0; t.setAttribute('role', 'combobox'); });
  document.querySelectorAll('.select-item').forEach(function (i) { i.tabIndex = 0; i.setAttribute('role', 'option'); });
  document.querySelectorAll('.calendar-grid .day:not(.out)').forEach(function (d) { d.tabIndex = 0; });
  document.querySelectorAll('.checkbox').forEach(function (c) { c.setAttribute('role', 'checkbox'); c.setAttribute('aria-checked', String(c.classList.contains('checked'))); });
  document.querySelectorAll('.toggle').forEach(function (t) { t.setAttribute('aria-pressed', String(t.classList.contains('on'))); });

  /* Tabs: open the tab named in the address (#settings-lock), else the one drawn active. */
  document.querySelectorAll('.tabs-list').forEach(function (list) {
    var triggers = Array.prototype.slice.call(list.querySelectorAll('.tabs-trigger[href^="#"]'));
    if (!triggers.length) return;
    var start = triggers.filter(function (t) { return t.getAttribute('href') === location.hash; })[0]
      || triggers.filter(function (t) { return t.classList.contains('active'); })[0] || triggers[0];
    showTab(start);
  });

  document.querySelectorAll('[data-show]').forEach(function (s) { refreshShown(s.dataset.show); });

  /* Tag inputs: type a tag and press Enter. */
  document.querySelectorAll('input[data-testid$="tag-input"]').forEach(function (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addTag(input); }
    });
  });
});

document.addEventListener('click', function (e) {
  var tab = e.target.closest('.tabs-trigger[href^="#"]');
  if (tab) { e.preventDefault(); showTab(tab); history.replaceState(null, '', tab.getAttribute('href')); return; }
  if (activate(e.target)) return;
  /* A click anywhere else closes an open drop-down. */
  document.querySelectorAll('.select').forEach(function (sel) {
    if (!sel.contains(e.target)) openSelect(sel, false);
  });
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { document.querySelectorAll('.select').forEach(function (sel) { openSelect(sel, false); }); return; }
  if (e.key !== 'Enter' && e.key !== ' ') return;
  var t = e.target;
  if (t.matches && t.matches('.switch, .radio-card, .select-trigger, .select-item, .calendar-grid .day')) {
    e.preventDefault();
    activate(t);
  }
});
