import { Injectable } from '@angular/core';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
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

async upsertUser(
  fbUser: FirebaseUser,
  provider = 'email',
  rol: 'cliente' | 'admin' = 'cliente'
): Promise<void> {
  if (!fbUser?.uid) return;

  const ref = doc(this.db, 'usuarios', fbUser.uid);
  const snap = await getDoc(ref);

  let finalRol = rol;

  // Si el usuario ya existe, NO sobrescribir su rol
  if (snap.exists()) {
    const data = snap.data();
    if (data?.["rol"]) {
      finalRol = data["rol"]; // conservar el rol actual (ej. admin)
    }
  }

  const base: AppUser = {
    uid: fbUser.uid,
    email: fbUser.email ?? null,
    displayName: fbUser.displayName ?? null,
    photoURL: fbUser.photoURL ?? null,
    provider,
    rol: finalRol,
  };

  await setDoc(
    ref,
    {
      ...base,
      lastLogin: serverTimestamp(),
      ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );
}

async getUserData(uid: string): Promise<AppUser | null> {
  const ref = doc(this.db, 'usuarios', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as AppUser) : null;
}

  // Obtener todos los usuarios
  async getAllUsers(): Promise<AppUser[]> {
    const usersCollection = collection(this.db, 'usuarios');
    const snap = await getDocs(usersCollection);
    return snap.docs.map(doc => ({
      ...(doc.data() as AppUser),
      uid: doc.id
    }));
  }

  // Crear usuario
  async createUser(user: Omit<AppUser, 'uid'>): Promise<string> {
    const ref = doc(collection(this.db, 'usuarios'));
    await setDoc(ref, {
      ...user,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    return ref.id;
  }

  // Actualizar usuario
  async updateUser(uid: string, userData: Partial<AppUser>): Promise<void> {
    const ref = doc(this.db, 'usuarios', uid);
    await setDoc(ref, userData, { merge: true });
  }

  // Eliminar usuario
  async deleteUser(uid: string): Promise<void> {
    const ref = doc(this.db, 'usuarios', uid);
    await deleteDoc(ref);
  }

}

