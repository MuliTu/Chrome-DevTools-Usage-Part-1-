import { useState, useEffect } from 'react';
import { subscribeNetLog } from '../api/fakeNetwork';
import styles from './NetworkLog.module.css';

export function NetworkLog() {
  const [rows, setRows] = useState([]);

  useEffect(() => subscribeNetLog(setRows), []);

  const maxMs = Math.max(...rows.map(r => r.ms), 100);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span>Network Requests</span>
        <span className={styles.count}>{rows.length} requests</span>
      </div>
      <div className={styles.head}>
        <span>URL</span><span>Method</span><span>Status</span><span>Time</span><span>Waterfall</span>
      </div>
      {rows.map((r, i) => {
        const pct = Math.round((r.ms / maxMs) * 100);
        const sc = r.status >= 400 ? 'err' : r.ms > 1200 ? 'slow' : 'ok';
        return (
          <div key={i} className={styles.row}>
            <span className={styles.url} title={r.url}>{r.url}</span>
            <span className={styles.muted}>{r.method}</span>
            <span className={`${styles.status} ${styles[sc]}`}>{r.status}</span>
            <span className={styles.muted}>{r.ms}ms</span>
            <div className={styles.barWrap}>
              <div className={`${styles.bar} ${styles[sc]}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
