#!/usr/bin/env node

/**
 * Script para gerar ícones circulares perfeitamente redondos
 * Cria uma versão do ícone com círculo branco de fundo e padding adequado
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const ICON_PATH = path.join(ASSETS_DIR, 'icon.png');
const ADAPTIVE_ICON_PATH = path.join(ASSETS_DIR, 'adaptive-icon.png');
const SPLASH_PATH = path.join(ASSETS_DIR, 'splash.png');

// Configurações
const ICON_SIZE = 1024;
const ADAPTIVE_ICON_SIZE = 1024;
const SPLASH_SIZE_WIDTH = 1284;
const SPLASH_SIZE_HEIGHT = 2778;
const PADDING_PERCENTAGE = 0.15; // 15% de padding
const CIRCLE_COLOR = '#4CAF50'; // Cor de fundo do círculo

/**
 * Criar ícone circular com padding
 */
async function createCircularIcon(inputPath, outputPath, size, backgroundColor = '#4CAF50') {
  try {
    console.log(`📝 Processando: ${path.basename(outputPath)}`);
    
    // Ler a imagem original
    const imageBuffer = await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Calcular tamanho do conteúdo com padding
    const padding = Math.floor(size * PADDING_PERCENTAGE);
    const contentSize = size - (padding * 2);

    // Criar círculo de fundo
    const circleSvg = `
      <svg width="${size}" height="${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${backgroundColor}"/>
      </svg>
    `;

    // Redimensionar conteúdo
    const resizedContent = await sharp(imageBuffer)
      .resize(contentSize, contentSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Combinar círculo com conteúdo
    await sharp(Buffer.from(circleSvg))
      .composite([{
        input: resizedContent,
        top: padding,
        left: padding,
      }])
      .png()
      .toFile(outputPath);

    console.log(`✅ Criado: ${path.basename(outputPath)} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Erro ao criar ${outputPath}:`, error.message);
    throw error;
  }
}

/**
 * Criar splash screen com ícone circular centralizado
 */
async function createSplashScreen(iconPath, outputPath, width, height, backgroundColor = '#4CAF50') {
  try {
    console.log(`📝 Processando: ${path.basename(outputPath)}`);
    
    // Criar fundo colorido
    const backgroundSvg = `
      <svg width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
      </svg>
    `;

    // Tamanho do ícone na splash (30% da largura)
    const iconSize = Math.floor(width * 0.3);
    const iconBuffer = await sharp(iconPath)
      .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Criar círculo branco de fundo para o ícone
    const circleSize = iconSize + 40;
    const circleSvg = `
      <svg width="${circleSize}" height="${circleSize}">
        <circle cx="${circleSize/2}" cy="${circleSize/2}" r="${circleSize/2}" fill="white"/>
      </svg>
    `;

    const circleBuffer = await sharp(Buffer.from(circleSvg)).png().toBuffer();

    // Posição centralizada
    const circleTop = Math.floor((height - circleSize) / 2);
    const circleLeft = Math.floor((width - circleSize) / 2);
    const iconTop = Math.floor((height - iconSize) / 2);
    const iconLeft = Math.floor((width - iconSize) / 2);

    // Combinar tudo
    await sharp(Buffer.from(backgroundSvg))
      .composite([
        {
          input: circleBuffer,
          top: circleTop,
          left: circleLeft,
        },
        {
          input: iconBuffer,
          top: iconTop,
          left: iconLeft,
        }
      ])
      .png()
      .toFile(outputPath);

    console.log(`✅ Criado: ${path.basename(outputPath)} (${width}x${height})`);
  } catch (error) {
    console.error(`❌ Erro ao criar ${outputPath}:`, error.message);
    throw error;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🎨 Gerando ícones circulares...\n');

  try {
    // Verificar se sharp está instalado
    try {
      require('sharp');
    } catch (error) {
      console.error('❌ Sharp não está instalado!');
      console.log('📦 Instalando sharp...\n');
      require('child_process').execSync('npm install sharp --save-dev', { stdio: 'inherit' });
      console.log('\n✅ Sharp instalado com sucesso!\n');
    }

    // Verificar se existe icon.svg, senão usar icon.png
    const svgPath = path.join(ASSETS_DIR, 'icon.svg');
    const sourcePath = fs.existsSync(svgPath) ? svgPath : ICON_PATH;

    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Arquivo de ícone não encontrado: ${sourcePath}`);
      console.log('💡 Certifique-se de ter um arquivo icon.png ou icon.svg em assets/');
      process.exit(1);
    }

    console.log(`📁 Usando ícone: ${path.basename(sourcePath)}\n`);

    // Gerar ícones
    await createCircularIcon(sourcePath, ICON_PATH, ICON_SIZE, CIRCLE_COLOR);
    await createCircularIcon(sourcePath, ADAPTIVE_ICON_PATH, ADAPTIVE_ICON_SIZE, CIRCLE_COLOR);
    
    // Gerar splash screen
    await createSplashScreen(ICON_PATH, SPLASH_PATH, SPLASH_SIZE_WIDTH, SPLASH_SIZE_HEIGHT, CIRCLE_COLOR);

    console.log('\n✅ Todos os ícones foram gerados com sucesso!');
    console.log('\n📱 Próximos passos:');
    console.log('   1. Execute: npx expo prebuild --clean');
    console.log('   2. Execute: npx expo run:android ou npx expo run:ios');
    console.log('   3. Ou faça build com: eas build\n');
  } catch (error) {
    console.error('\n❌ Erro ao gerar ícones:', error.message);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { createCircularIcon, createSplashScreen };
