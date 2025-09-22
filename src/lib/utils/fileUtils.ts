export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: 'image' | 'audio' | 'text';
}

// 支持的文件类型
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
];

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/m4a',
  'audio/aac'
];

// 文件大小限制 (MB)
export const MAX_FILE_SIZE = {
  image: 10, // 10MB
  audio: 50, // 50MB
};

/**
 * 验证文件是否符合要求
 */
export function validateFile(file: File): FileValidationResult {
  // 检查文件大小
  const fileSizeMB = file.size / (1024 * 1024);

  // 确定文件类型
  let fileType: 'image' | 'audio' | 'text';
  let maxSize: number;

  if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    fileType = 'image';
    maxSize = MAX_FILE_SIZE.image;
  } else if (SUPPORTED_AUDIO_TYPES.includes(file.type)) {
    fileType = 'audio';
    maxSize = MAX_FILE_SIZE.audio;
  } else {
    return {
      isValid: false,
      error: `不支持的文件类型: ${file.type}。支持的图片格式: ${SUPPORTED_IMAGE_TYPES.join(', ')}。支持的音频格式: ${SUPPORTED_AUDIO_TYPES.join(', ')}`
    };
  }

  // 检查文件大小
  if (fileSizeMB > maxSize) {
    return {
      isValid: false,
      error: `文件过大。${fileType === 'image' ? '图片' : '音频'}文件最大支持 ${maxSize}MB，当前文件大小: ${fileSizeMB.toFixed(2)}MB`
    };
  }

  return {
    isValid: true,
    fileType
  };
}

/**
 * 创建图片预览 URL
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      reject(new Error('不支持的图片格式'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => {
      reject(new Error('读取图片失败'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 将文件转换为 ArrayBuffer
 */
export function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as ArrayBuffer);
    };
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 压缩图片 (如果需要)
 */
export function compressImage(file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      reject(new Error('不支持的图片格式'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 计算新的尺寸
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('图片压缩失败'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * 检查浏览器是否支持文件 API
 */
export function checkFileAPISupport(): boolean {
  return !!(window.File && window.FileReader && window.FileList && window.Blob);
}

/**
 * 检查浏览器是否支持拖拽上传
 */
export function checkDragDropSupport(): boolean {
  const div = document.createElement('div');
  return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) &&
    'FormData' in window &&
    'FileReader' in window;
}

// 分块读取大文件
export async function readLargeFile(file: File, chunkSize = 1024 * 1024) { // 1MB chunks
  const chunks = [];
  const fileSize = file.size;

  for (let start = 0; start < fileSize; start += chunkSize) {
    const end = Math.min(start + chunkSize, fileSize);
    const chunk = file.slice(start, end);
    const arrayBuffer = await chunk.arrayBuffer();
    chunks.push(new Uint8Array(arrayBuffer));

    // 可以在这里处理每个块，而不是存储所有块
    console.log(`已读取: ${((end / fileSize) * 100).toFixed(1)}%`);
  }

  return chunks;
}