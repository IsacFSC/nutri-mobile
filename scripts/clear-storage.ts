/**
 * Script para limpar AsyncStorage
 * Use quando precisar resetar a autenticação
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

async function clearStorage() {
  try {
    console.log('🧹 Limpando AsyncStorage...');
    
    const keys = await AsyncStorage.getAllKeys();
    console.log('Chaves encontradas:', keys);
    
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage limpo com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao limpar AsyncStorage:', error);
  }
}

clearStorage();
