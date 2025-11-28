import { Injectable } from '@angular/core';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import type { User as FirebaseUser } from 'firebase/auth';
import { AppUser } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private _db: ReturnType<typeof getFirestore> | null = null;

  private get db() {
    if (!this._db) {
      // Asegurar que la app Firebase esté inicializada antes de obtener Firestore
      if (!getApps().length) {
        initializeApp(environment.firebase);
      }
      this._db = getFirestore();
    }
    return this._db;
  }

  async upsertUser(fbUser: FirebaseUser, provider = 'email'): Promise<void> {
    if (!fbUser?.uid) return;
    const ref = doc(this.db, 'usuarios', fbUser.uid);
    const snap = await getDoc(ref);

    const base: AppUser = {
      uid: fbUser.uid,
      email: fbUser.email ?? null,
      displayName: fbUser.displayName ?? null,
      photoURL: fbUser.photoURL ?? null,
      provider
    };

    if (!snap.exists()) {
      await setDoc(ref, {
        ...base,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      }, { merge: true });
    } else {
      await setDoc(ref, {
        ...base,
        lastLogin: serverTimestamp()
        
      }, { merge: true });
    }
  }
}