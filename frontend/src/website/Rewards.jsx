import React, { useState, useEffect } from 'react';
import './Rewards.css';
import Lottie from 'lottie-react';

const ALL_TIERS = [
  { tier: 4, title: 'Bronze',  threshold: 5000,    reward:  500 },
  { tier: 3, title: 'Silver',  threshold: 25000,   reward: 2500 },
  { tier: 2, title: 'Gold',    threshold: 50000,   reward: 5000 },
  { tier: 1, title: 'Diamond', threshold:100000,   reward: 1000 },
];

const Rewards = () => {
  const [earned, setEarned]     = useState([]);
  const [totalSpent, setTotal]  = useState(0);
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState(null);
  const [animData, setAnimData] = useState(null);

  const load = (claim = false) => {
    const url = 'http://localhost:5000/api/users/reward' + (claim ? '?claim=true' : '');
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch rewards');
        return r.json();
      })
      .then(({ badges, total_spent }) => {
        setEarned(badges || []);
        setTotal(total_spent || 0);
      })
      .catch(e => setError(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const nextTier = ALL_TIERS.find(t => totalSpent >= t.threshold && !earned.find(b=>b.tier===t.tier))
                     || ALL_TIERS.slice().reverse().find(t => !earned.find(b=>b.tier===t.tier)); 

  const openModal = tierObj => {
    const already = earned.find(b=>b.tier===tierObj.tier);
    const status = already
      ? 'claimed'
      : (tierObj.tier === nextTier?.tier && totalSpent >= tierObj.threshold)
        ? 'claimable'
        : 'locked';

    setSelected({
      ...tierObj,
      status,
      awarded_at: already?.awarded_at || null,
    });

    if (status !== 'locked') {
      fetch(`/assets/${tierObj.title}.json`)
        .then(r => r.json())
        .then(setAnimData)
        .catch(console.error);
    }
  };

  const closeModal = () => {
    setSelected(null);
    setAnimData(null);
  };

  const handleClaim = () => {
    load(true);             
    setTimeout(closeModal, 3500);
  };

  const next = ALL_TIERS.find(t => totalSpent < t.threshold);
  const pct = next
    ? Math.min((totalSpent / next.threshold) * 100, 100)
    : 100;
  const label = next ? `${Math.floor(pct)}%` : 'MAX';

  return (
    <div className="rewards-wrapper">
      <h1 className="rewards-header">My Badges</h1>
      {error && <div className="error">{error}</div>}

      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }}>
            <span className="progress-text">{label}</span>
          </div>
        </div>
        {next && (
          <p className="progress-info">
            ₹{totalSpent.toLocaleString()} of ₹{next.threshold.toLocaleString()} ({next.title})
          </p>
        )}
      </div>

      <div className="badge-grid">
        {ALL_TIERS.map(t => {
          const status = earned.find(b=>b.tier===t.tier)
            ? 'claimed'
            : (t.tier === nextTier?.tier && totalSpent >= t.threshold)
              ? 'claimable'
              : 'locked';
          return (
            <div
              key={t.tier}
              className={`badge-card ${status}`}
              onClick={() => openModal(t)}
            >
              <div className={`badge-icon tier-${t.tier}`} />
              <div className="badge-title">{t.title}</div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="badge-modal-overlay" onClick={closeModal}>
          <div className="badge-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              &times;
            </button>
            {animData && (
              <Lottie
                animationData={animData}
                loop={false}
                style={{ width: 250, height: 250, margin: '0 auto' }}
              />
            )}

            <h2>{selected.title}</h2>

            {selected.status === 'claimed' && (
              <p><strong>Unlocked at:</strong> {new Date(selected.awarded_at).toLocaleString()}</p>
            )}
            <p><strong>Requirement:</strong> Spend ₹{selected.threshold.toLocaleString()}</p>
            <p><strong>Reward:</strong> ₹{selected.reward.toLocaleString()}</p>

            {selected.status === 'claimable' && (
              <button className="claim-button" onClick={handleClaim}>
                Claim Reward
              </button>
            )}
            {selected.status === 'claimed' && (
              <button className="claim-button claimed" disabled>
                Claimed
              </button>
            )}
            {selected.status === 'locked' && (
              <button className="claim-button locked" disabled>
                Locked
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
