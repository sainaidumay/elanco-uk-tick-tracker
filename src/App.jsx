
import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import {
  Activity, MapPin, ShieldCheck, Search, Plus, PawPrint,
  CalendarDays, X, ExternalLink, Upload, CheckCircle2,
  AlertCircle, Bug, Info
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const API_URL = 'https://dev-task.elancoapps.com/data/tick-sightings';

const cityCoordinates = {
  Sheffield: [53.3811, -1.4701],
  London: [51.5072, -0.1276],
  Manchester: [53.4808, -2.2426],
  Bristol: [51.4545, -2.5879],
  Edinburgh: [55.9533, -3.1883],
  Cardiff: [51.4816, -3.1791],
  Birmingham: [52.4862, -1.8904],
  Glasgow: [55.8642, -4.2518],
  Liverpool: [53.4084, -2.9916],
  Nottingham: [52.9548, -1.1581],
  Southampton: [50.9097, -1.4044],
  Newcastle: [54.9783, -1.6178],
  Leicester: [52.6369, -1.1398],
  Leeds: [53.8008, -1.5491]
};

const severityColor = {
  Low: '#4b9b78',
  Medium: '#e4a33b',
  High: '#d65d55'
};

const initialSightings = [
  {
    id: 'sample-1',
    city: 'Sheffield',
    region: 'Yorkshire and the Humber',
    species: 'Castor bean tick',
    severity: 'Medium',
    date: '2026-10-25',
    lat: 53.3811,
    lng: -1.4701,
    notes: 'Tick found on a dog after a woodland walk.'
  },
  {
    id: 'sample-2',
    city: 'London',
    region: 'London',
    species: 'Sheep tick',
    severity: 'High',
    date: '2026-10-23',
    lat: 51.5072,
    lng: -0.1276,
    notes: 'Several ticks reported near a park.'
  },
  {
    id: 'sample-3',
    city: 'Manchester',
    region: 'North West',
    species: 'Castor bean tick',
    severity: 'Low',
    date: '2026-10-19',
    lat: 53.4808,
    lng: -2.2426,
    notes: 'Single tick sighting.'
  },
  {
    id: 'sample-4',
    city: 'Bristol',
    region: 'South West',
    species: 'Hedgehog tick',
    severity: 'Medium',
    date: '2026-10-14',
    lat: 51.4545,
    lng: -2.5879,
    notes: 'Reported in a garden.'
  },
  {
    id: 'sample-5',
    city: 'Edinburgh',
    region: 'Scotland',
    species: 'Sheep tick',
    severity: 'High',
    date: '2026-10-10',
    lat: 55.9533,
    lng: -3.1883,
    notes: 'Tick found after countryside walk.'
  },
  {
    id: 'sample-6',
    city: 'Cardiff',
    region: 'Wales',
    species: 'Castor bean tick',
    severity: 'Low',
    date: '2026-10-04',
    lat: 51.4816,
    lng: -3.1791,
    notes: 'Single sighting submitted by a resident.'
  },
  {
    id: 'sample-7',
    city: 'Birmingham',
    region: 'West Midlands',
    species: 'Hedgehog tick',
    severity: 'Medium',
    date: '2026-09-28',
    lat: 52.4862,
    lng: -1.8904,
    notes: 'Tick found on a pet.'
  }
];

function readSavedReports() {
  try {
    const saved = localStorage.getItem('elanco-sightings');
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function StatCard({ icon: Icon, label, value, note, tone }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <div className="stat-value">{value}</div>
        <p className="stat-note">{note}</p>
      </div>
    </article>
  );
}

function App() {
  const [sightings, setSightings] = useState(() => [
    ...readSavedReports(),
    ...initialSightings
  ]);

  const [apiStatus, setApiStatus] = useState('loading');
  const [apiError, setApiError] = useState('');

  const [search, setSearch] = useState('');
  const [species, setSpecies] = useState('All species');
  const [severity, setSeverity] = useState('All levels');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedCity, setSelectedCity] = useState('All cities');
  const [selectedYear, setSelectedYear] = useState('All years');
  
  const cityOptions = [
  'All cities',
  ...new Set(sightings.map(item => item.city).filter(Boolean))
];

const yearOptions = [
  'All years',
  ...new Set(
    sightings
      .filter(item => item.date)
      .map(item => String(new Date(item.date).getFullYear()))
  )
];

  const [selected, setSelected] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [notice, setNotice] = useState('');

  const [form, setForm] = useState({
    city: '',
    species: 'Unknown',
    date: new Date().toISOString().slice(0, 10),
    severity: 'Medium',
    notes: ''
  });

  const [photo, setPhoto] = useState(null);

  // Fetch real tick sightings from the Elanco API.
  useEffect(() => {
    const controller = new AbortController();

    async function loadSightings() {
      try {
        setApiStatus('loading');
        setApiError('');

        const response = await fetch(API_URL, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Unexpected API response format.');
        }

        const formattedSightings = data.map(item => {
          const city = item.location || 'Unknown location';
          const coordinates = cityCoordinates[city];

          return {
            id: item.id,
            city: city,
            region: '',
            species: item.species || 'Unknown species',
            latinName: item.latinName || '',
            date: item.date || '',
            lat: coordinates ? coordinates[0] : null,
            lng: coordinates ? coordinates[1] : null,
            severity: null,
            notes: 'Record supplied by the Elanco Tick Sightings API.',
            source: 'api'
          };
        });

        // Keep locally submitted reports alongside API records.
        setSightings([
          ...readSavedReports(),
          ...formattedSightings
        ]);

        setApiStatus('success');

        console.log(
          'Elanco API records loaded:',
          formattedSightings.length
        );

      } catch (error) {
        if (error.name === 'AbortError') return;

        console.error('API error:', error);
        setApiError(error.message);
        setApiStatus('error');
      }
    }

    loadSightings();

    return () => controller.abort();
  }, []);

  // Build species options automatically from the loaded records.
  const speciesOptions = useMemo(() => {
    return [...new Set(
      sightings.map(item => item.species).filter(Boolean)
    )].sort();
  }, [sightings]);

  // Filter records by city, species and severity.
  
const filtered = useMemo(() => {
  return sightings.filter(item => {
    const city = item.city || '';
    const searchText =
      `${city} ${item.region || ''} ${item.species || ''}`.toLowerCase();

    const matchesSearch =
      searchText.includes(search.toLowerCase());

    const matchesSpecies =
      species === 'All species' || item.species === species;

    const matchesSeverity =
      severity === 'All levels' || item.severity === severity;

    const itemDate = item.date
      ? item.date.slice(0, 10)
      : '';

    const matchesStartDate =
      !startDate || (itemDate && itemDate >= startDate);

    const matchesEndDate =
      !endDate || (itemDate && itemDate <= endDate);

    return (
      matchesSearch &&
      matchesSpecies &&
      matchesSeverity &&
      matchesStartDate &&
      matchesEndDate
    );
  });
}, [sightings, search, species, severity, startDate, endDate]);



  // Calculate monthly sightings from actual record dates.

const chartData = useMemo(() => {
  const labels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const monthlyCounts = Array(12).fill(0);

  sightings.forEach(item => {
    if (!item.date) return;

    const date = new Date(item.date);

    if (Number.isNaN(date.getTime())) return;

    const itemYear = String(date.getFullYear());

    const matchesCity =
      selectedCity === 'All cities' ||
      item.city === selectedCity;

    const matchesYear =
      selectedYear === 'All years' ||
      itemYear === selectedYear;

    if (matchesCity && matchesYear) {
      monthlyCounts[date.getMonth()]++;
    }
  });

  return {
    labels,
    datasets: [{
      label: 'Tick sightings',
      data: monthlyCounts,
      backgroundColor: '#4f9877',
      borderRadius: 7,
      maxBarThickness: 34
    }]
  };
}, [sightings, selectedCity, selectedYear]);

  const timelineSightings = useMemo(() => {
    return [...filtered]
      .filter(item => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }, [filtered]);

  const highSeverityCount = sightings.filter(
    item => item.severity === 'High'
  ).length;

  const hasSeverityData = sightings.some(
    item => Boolean(item.severity)
  );

 function resetFilters() {
  setSearch('');
  setSpecies('All species');
  setSeverity('All levels');
  setStartDate('');
  setEndDate('');
}

  function submitReport(event) {
    event.preventDefault();

    if (
      !form.city.trim() ||
      !form.date ||
      !form.time ||
      !form.notes.trim()
    ) {
      setNotice('Please complete the city, date, time, and description fields.');
      return;
    }

    const city = form.city.trim();
    const coordinates = cityCoordinates[city];

    const newSighting = {
      id: `local-${Date.now()}`,
      city,
      region: '',
      species: form.species,
      severity: form.severity,
      date: form.date,
      time: form.time,
      lat: coordinates ? coordinates[0] : null,
      lng: coordinates ? coordinates[1] : null,
      notes: form.notes.trim(),
      photoName: photo?.name || '',
      source: 'local'
    };

    const updatedReports = [
      newSighting,
      ...readSavedReports()
    ];

    try {
      localStorage.setItem(
        'elanco-sightings',
        JSON.stringify(updatedReports)
      );
    } catch (error) {
      console.error('Could not save report:', error);
    }

    setSightings(current => [
      newSighting,
      ...current
    ]);

    setSelected(newSighting);
    setShowReport(false);

    setForm({
      city: '',
      species: 'Unknown',
      date: new Date().toISOString().slice(0, 10),
      severity: 'Medium',
      notes: ''
    });

    setPhoto(null);

    setNotice(
      'Your demonstration report has been added to this browser.'
    );

    window.setTimeout(() => setNotice(''), 5000);
  }

  return (
    <div className="app-shell">

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Bug size={23} />
          </div>
          <div>
            <strong>tick<span>tracker</span></strong>
            <small>UK COMMUNITY MAP</small>
          </div>
        </div>

        <div className="side-label">WORKSPACE</div>

        <a className="side-link active" href="#overview">
          <Activity size={18} /> Overview
        </a>

        <a className="side-link" href="#map">
          <MapPin size={18} /> Sightings map
        </a>

        <a className="side-link" href="#education">
          <ShieldCheck size={18} /> Tick education
        </a>

        <div className="side-help">
          <div className="help-icon">
            <Info size={18} />
          </div>
          <strong>Stay tick aware</strong>
          <p>
            Check yourself and your pets after spending time outdoors.
          </p>
          <a href="#education">
            Prevention tips <ExternalLink size={13} />
          </a>
        </div>

        <div className="sidebar-footer">
          A community awareness project<br />
          Elanco API · Educational demonstration
        </div>
      </aside>

      <main className="main-content">

        <header className="topbar">
          <div>
            <div className="eyebrow">
              ELANCO PLACEMENT PROJECT
            </div>
            <h1>UK Tick Tracker</h1>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              setShowReport(true);
              setNotice('');
            }}
          >
            <Plus size={17} /> Report a sighting
          </button>
        </header>

        <section id="overview" className="intro-row">
          <div>
            <h2>Tick activity overview</h2>
            <p>
              Explore community-reported tick sightings across the United Kingdom.
            </p>
          </div>

          <div className="updated">
            <span className="live-dot"></span>
            {apiStatus === 'loading' && 'Loading API data'}
            {apiStatus === 'success' && 'Connected to Elanco API'}
            {apiStatus === 'error' && 'Showing fallback data'}
          </div>
        </section>

        {notice && (
          <div className="notice">
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}

        {apiError && (
          <div className="notice">
            <AlertCircle size={17} />
            API unavailable: {apiError}. Showing available local/sample records.
          </div>
        )}

        <section className="stats-grid">
          <StatCard
            icon={MapPin}
            label="Total sightings"
            value={sightings.length.toLocaleString()}
            note="API records and local reports"
            tone="green"
          />

          <StatCard
            icon={Activity}
            label="Filtered sightings"
            value={filtered.length.toLocaleString()}
            note="Based on your filters"
            tone="blue"
          />

          <StatCard
            icon={ShieldCheck}
            label="High severity"
            value={hasSeverityData ? highSeverityCount : '—'}
            note={
              hasSeverityData
                ? 'Records with a severity value'
                : 'Not provided by the API'
            }
            tone="orange"
          />

          <StatCard
            icon={PawPrint}
            label="Species recorded"
            value={
              new Set(sightings.map(item => item.species)).size
            }
            note="Distinct species in the records"
            tone="purple"
          />
        </section>

        <section id="map" className="panel map-panel">

          <div className="panel-heading map-heading">
            <div>
              <h3>Explore sightings</h3>
              <p>
                Markers use approximate city-centre coordinates.
              </p>
            </div>

            <span className="result-count">
              {filtered.length} results
            </span>
          </div>

          <div className="filters">

            <label className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search city, region or species"
              />
            </label>

            <select
              value={species}
              onChange={event => setSpecies(event.target.value)}
              aria-label="Filter by species"
            >
              <option>All species</option>
              {speciesOptions.map(name => (
                <option key={name}>{name}</option>
              ))}
            </select>

            <select
              value={severity}
              onChange={event => setSeverity(event.target.value)}
              aria-label="Filter by severity"
            >
              <option>All levels</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
             <input
              type="date"
              value={startDate}
              onChange={event => setStartDate(event.target.value)}
              aria-label="Start date"
            />

            <input
              type="date"
              value={endDate}
              onChange={event => setEndDate(event.target.value)}
              aria-label="End date"
            />          
            <button
              className="reset-button"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>

          <div className="map-wrap">

            <MapContainer
              center={[54.1, -3.0]}
              zoom={5.5}
              scrollWheelZoom={true}
              className="leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {filtered
                .filter(item =>
                  Number.isFinite(item.lat) &&
                  Number.isFinite(item.lng)
                )
                .map(item => (
                  <CircleMarker
                    key={item.id}
                    center={[item.lat, item.lng]}
                    radius={8}
                    pathOptions={{
                      color: '#fff',
                      weight: 2,
                      fillColor:
                        severityColor[item.severity] || '#4f9877',
                      fillOpacity: 0.95
                    }}
                    eventHandlers={{
                      click: () => setSelected(item)
                    }}
                  >
                    <Popup>
                      <strong>{item.city}</strong>
                      <br />
                      {item.species}
                      <br />
                      {item.date
                        ? item.date.slice(0, 10)
                        : 'Date unavailable'}
                    </Popup>
                  </CircleMarker>
                ))}
            </MapContainer>

            <div className="map-legend">
              <strong>Marker key</strong>
              <span>
                <i style={{ background: '#4f9877' }} />
                API / unclassified
              </span>
              <span>
                <i style={{ background: severityColor.High }} />
                High (local reports)
              </span>
              <span>
                <i style={{ background: severityColor.Medium }} />
                Medium (local reports)
              </span>
              <span>
                <i style={{ background: severityColor.Low }} />
                Low (local reports)
              </span>
            </div>
          </div>

          <div className="map-footnote">
            <Info size={14} />
            API records contain city names, not precise coordinates or severity ratings.
            Markers show approximate city-centre locations.
          </div>
        </section>

        <section className="lower-grid">

          <div className="panel">
            <div className="panel-heading">
              <div>
                <h3>Recent sightings</h3>
                <p>Select a report to view its details.</p>
              </div>
            </div>

            <div className="sighting-list">

              {filtered.slice(0, 5).map(item => (
                <button
                  className={`sighting-row ${
                    selected?.id === item.id ? 'chosen' : ''
                  }`}
                  key={item.id}
                  onClick={() => setSelected(item)}
                >
                  <span
                    className="sighting-pin"
                    style={{
                      background:
                        severityColor[item.severity] || '#4f9877'
                    }}
                  >
                    <MapPin size={16} />
                  </span>

                  <span className="sighting-main">
                    <strong>{item.city}</strong>
                    <small>
                      {item.species} · {item.date
                        ? item.date.slice(0, 10)
                        : 'Date unavailable'}
                    </small>
                  </span>

                  <span
                    className={
                      item.severity
                        ? `severity ${item.severity.toLowerCase()}`
                        : 'severity'
                    }
                  >
                    {item.severity || 'Not rated'}
                  </span>
                </button>
              ))}

              {filtered.length === 0 && (
                <p className="empty-state">
                  No reports match these filters.
                </p>
              )}
            </div>

            {selected && (
                  <div className="detail-card" id="sighting-details">
                  <div className="detail-title">
                  <strong>{selected.city} sighting</strong>
                  <button
                    className="icon-button"
                    onClick={() => setSelected(null)}
                    aria-label="Close details"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p><b>Species:</b> {selected.species}</p>

                {selected.latinName && (
                  <p>
                    <b>Scientific name:</b> <i>{selected.latinName}</i>
                  </p>
                )}

                <p>
                  <b>Date:</b> {selected.date
                    ? selected.date.replace('T', ' ')
                    : 'Not available'}
                </p>
<p>
  <b>Time:</b> {selected.time || 'Not available'}
</p>
                <p>
                  <b>Severity:</b> {selected.severity || 'Not provided by API'}
                </p>

                <p>
                  {selected.notes || 'No additional description was supplied.'}
                </p>
              </div>
            )}
            <div className="detail-actions">
  <button
    type="button"
    onClick={() => {
      const query = encodeURIComponent(selected.city + ', UK');
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        '_blank'
      );
    }}
  >
    <MapPin size={16} /> Directions
  </button>

  <button
    type="button"
    onClick={async () => {
      const shareText =
        `${selected.city} - ${selected.species} - ${selected.date}`;

      if (navigator.share) {
        await navigator.share({ title: 'Tick sighting', text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setNotice('Sighting details copied to clipboard.');
      }
    }}
  >
    <ExternalLink size={16} /> Share
  </button>
</div>
          </div>

          <div className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <h3>Seasonal activity</h3>
                <p>
                  Number of records by month, using available sighting dates.
                </p>
              </div>
              <CalendarDays size={19} className="muted-icon" />
            </div>
             <div className="chart-filters">
  <select
    value={selectedCity}
    onChange={event => setSelectedCity(event.target.value)}
    aria-label="Filter chart by city"
  >
    {cityOptions.map(city => (
      <option key={city} value={city}>{city}</option>
    ))}
  </select>

  <select
    value={selectedYear}
    onChange={event => setSelectedYear(event.target.value)}
    aria-label="Filter chart by year"
  >
    {yearOptions.map(year => (
      <option key={year} value={year}>{year}</option>
    ))}
  </select>
</div>
            <div className="chart-area">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                  },
                  scales: {
                    x: {
                      grid: { display: false }
                    },
                    y: {
                      beginAtZero: true,
                      ticks: { precision: 0 },
                      grid: { color: '#edf1ee' }
                    }
                  }
                }}
              />
            </div>

            <div className="chart-note">
              Counts are calculated from the loaded records and grouped by calendar month across all years.
            </div>
          </div>
        </section>

<section className="panel timeline-panel">
  <div className="panel-heading">
    <div>
      <h3>Sighting timeline</h3>
      <p>Latest recorded tick sightings, newest first.</p>
    </div>
    <CalendarDays size={20} />
  </div>

  <div className="timeline-list">
    {timelineSightings.map(item => (
      <button
        key={item.id}
        className="timeline-item"
       onClick={() => {
  setSelected(item);

  setTimeout(() => {
    document.getElementById('sighting-details')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, 150);
}}
      >
        <span className="timeline-dot" />

        <span className="timeline-content">
          <strong>{item.city} — {item.species}</strong>

          <small>
            {new Date(item.date).toLocaleDateString('en-GB')}
          </small>

          <small>
            {item.latinName || 'Scientific name not provided'}
          </small>
        </span>

        <span className="timeline-arrow">View</span>
      </button>
    ))}

    {timelineSightings.length === 0 && (
      <p className="empty-state">
        No dated sightings are available for this selection.
      </p>
    )}
  </div>
</section>

        <section id="education" className="education-section">
          <div className="section-title">
            <div>
              <div className="eyebrow">KNOW BEFORE YOU GO</div>
              <h2>Tick awareness</h2>
              <p>
                Basic educational information for people and pet owners.
              </p>
            </div>
          </div>

          <div className="education-grid">

            <article className="education-card">
              <div className="edu-icon green">
                <Bug size={21} />
              </div>
              <h3>Common UK tick species</h3>
              <p>
                <b>Castor bean tick (Ixodes ricinus):</b>
                commonly found in grassy and wooded habitats.
              </p>
              <p>
                <b>Hedgehog tick:</b>
                associated with hedgehogs and other wildlife.
              </p>
            </article>

            <article className="education-card">
              <div className="edu-icon blue">
                <ShieldCheck size={21} />
              </div>
              <h3>Prevention tips</h3>
              <ul>
                <li>Wear long trousers in grassy or wooded areas.</li>
                <li>Use a suitable insect repellent according to its label.</li>
                <li>Check your skin, clothing and pets after walks.</li>
                <li>Remove attached ticks promptly using an appropriate tick remover.</li>
              </ul>
            </article>

          </div>
        </section>

        <footer className="footer">
          UK Tick Tracker · Educational demonstration project ·
          Not a veterinary or medical diagnosis service.
        </footer>

      </main>

      {showReport && (
        <div
          className="modal-backdrop"
          onClick={() => setShowReport(false)}
        >
          <section
            className="modal"
            onClick={event => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
          >

            <div className="modal-header">
              <div>
                <div className="eyebrow">COMMUNITY CONTRIBUTION</div>
                <h2 id="report-title">Report a sighting</h2>
                <p>
                  Submit a sample report to this demonstration app.
                </p>
              </div>

              <button
                className="icon-button"
                onClick={() => setShowReport(false)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <form
              onSubmit={submitReport}
              className="report-form"
            >

              <label>
                City or town
                <input
                  required
                  value={form.city}
                  onChange={event =>
                    setForm({ ...form, city: event.target.value })
                  }
                  placeholder="e.g. Sheffield"
                />
              </label>

              <div className="form-two">
                <label>
                  Date observed
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={event =>
                      setForm({ ...form, date: event.target.value })
                    }
                  />
                </label>
<label>
  Time observed
  <input
    required
    type="time"
    value={form.time || ''}
    onChange={event =>
      setForm({ ...form, time: event.target.value })
    }
  />
</label>
                <label>
                  Species
                  <select
                    value={form.species}
                    onChange={event =>
                      setForm({ ...form, species: event.target.value })
                    }
                  >
                    <option>Unknown</option>
                    {speciesOptions.map(name => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Report level (local demonstration reports)
                <select
                  value={form.severity}
                  onChange={event =>
                    setForm({ ...form, severity: event.target.value })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>

              <label>
                Description
                <textarea
                  required
                  rows="3"
                  value={form.notes}
                  onChange={event =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Where was it found? Was it on a person or pet?"
                />
              </label>

              <label className="upload-box">
                <Upload size={18} />
                <span>
                  {photo
                    ? photo.name
                    : 'Optional: upload a photograph'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={event =>
                    setPhoto(event.target.files?.[0] || null)
                  }
                />
              </label>

              <p className="form-disclaimer">
                <AlertCircle size={14} />
                Demo only: reports are stored in this browser.
                The selected photo is not sent to a server.
              </p>

              <button
                className="primary-button full-button"
                type="submit"
              >
                <Plus size={17} /> Submit report
              </button>

            </form>
          </section>
        </div>
      )}

    </div>
  );
}

export default App;
