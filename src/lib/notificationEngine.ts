/**
 * Wheyo Algorithmic Client-Side Push & In-App Notification Engine
 * Calculates contextual notifications based on user workouts, time elapsed, protein deficit, and campus ranking.
 * Zero server push dependencies required. Runs locally & securely in browser.
 */

import { getWorkoutHistory, getPointsBalance, POINTS_TO_INR_RATIO, getUserCampusId, BELGAUM_CAMPUSES } from './workoutMath';

export interface WheyoNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  actionUrl?: string;
  timestamp: number;
}

const NOTIFICATION_INTERVAL_MS = 3 * 60 * 1000; // Check every 3 minutes
const MIN_TIME_BETWEEN_NOTIFS_MS = 15 * 60 * 1000; // Don't spam, minimum 15 mins between notifications

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  } catch (e) {
    console.warn('Push notification permission request failed:', e);
  }
  return false;
}

export function sendLocalPushNotification(notif: WheyoNotification) {
  // 1. Browser Web Push if granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(notif.title, {
        body: notif.body,
        icon: notif.icon || '/favicon.ico',
        tag: notif.tag || 'wheyo-alert',
      });
    } catch (e) {
      console.warn('Web notification dispatch fallback:', e);
    }
  }

  // 2. Dispatch custom in-app event for iOS / mobile browsers & immediate visual feedback
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('wheyo-inapp-notification', { detail: notif });
    window.dispatchEvent(event);
  }
}

export function evaluateAlgorithmicNotification(): WheyoNotification | null {
  const history = getWorkoutHistory();
  const lastWorkout = history[0];
  const now = Date.now();
  const lastNotifTime = Number(localStorage.getItem('wheyo_last_notif_timestamp') || '0');

  // Throttle check
  if (now - lastNotifTime < MIN_TIME_BETWEEN_NOTIFS_MS) {
    return null;
  }

  // Rule 1: Anabolic Recovery Window (20-60 mins after last workout)
  if (lastWorkout && lastWorkout.timestamp) {
    const minutesSince = Math.round((now - lastWorkout.timestamp) / 60000);
    if (minutesSince >= 20 && minutesSince <= 75) {
      const proteinReq = Math.min(50, Math.max(30, Math.round(lastWorkout.caloriesBurned * 0.085)));
      return {
        id: 'anabolic_' + now,
        title: '🍗 Anabolic Window Alert!',
        body: `${minutesSince}m since your ${lastWorkout.title}. Refuel with ~${proteinReq}g clean protein to speed muscle protein synthesis.`,
        actionUrl: '/menu',
        timestamp: now,
      };
    }
  }

  // Rule 2: Campus War Motivation
  const campusId = getUserCampusId();
  const campus = BELGAUM_CAMPUSES.find((c) => c.id === campusId) || BELGAUM_CAMPUSES[0];
  const isWeekend = [0, 6].includes(new Date().getDay());

  if (campus && Math.random() > 0.5) {
    return {
      id: 'campus_' + now,
      title: `⚡ ${campus.shortName} Needs You!`,
      body: `Rank #${campus.rank} in Belgaum Campus War. Log a set today to push ${campus.shortName} up the leaderboard!`,
      actionUrl: '/campus-league',
      timestamp: now,
    };
  }

  // Rule 3: Points Balance & Real Discount Reminder
  const points = getPointsBalance();
  if (points >= 100) {
    const discount = (points * POINTS_TO_INR_RATIO).toFixed(0);
    return {
      id: 'points_' + now,
      title: `💰 ₹${discount} Discount Waiting!`,
      body: `You have ${points} Wheyo Points from training. Apply them at checkout for an instant ₹${discount} off your high-protein meal.`,
      actionUrl: '/menu',
      timestamp: now,
    };
  }

  // Rule 4: Hydration & Daily Workout Trigger
  return {
    id: 'hydrate_' + now,
    title: '💧 Wheyo Athlete Reminder',
    body: isWeekend ? 'Weekend gains count double! Hit your protein target and stay hydrated.' : 'Time to crush your afternoon workout! 110+ exercises ready to log.',
    actionUrl: '/workouts',
    timestamp: now,
  };
}

let notificationTimer: any = null;

export function initNotificationEngine() {
  if (typeof window === 'undefined') return;

  // Initial check after 10 seconds of app load
  setTimeout(() => {
    const notif = evaluateAlgorithmicNotification();
    if (notif) {
      sendLocalPushNotification(notif);
      localStorage.setItem('wheyo_last_notif_timestamp', String(Date.now()));
    }
  }, 10000);

  // Periodic check
  if (!notificationTimer) {
    notificationTimer = setInterval(() => {
      const notif = evaluateAlgorithmicNotification();
      if (notif) {
        sendLocalPushNotification(notif);
        localStorage.setItem('wheyo_last_notif_timestamp', String(Date.now()));
      }
    }, NOTIFICATION_INTERVAL_MS);
  }
}
