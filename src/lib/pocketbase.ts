import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'http://127.0.0.1:8090'; // CHANGE THIS

export const pb = new PocketBase(POCKETBASE_URL);

//- Esto actualiza el estado de la store
//- cada vez que hay un cambio en el modelo
//- o token del usuario autenticado.
pb.authStore.onChange(() => {
    // Note: This might trigger re-renders in your components
    // if you are using the authStore in a reactive way.
}, true);
