import { supabase } from './supabase';

// 简历数据类型
export interface ResumeData {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  description: string;
  photo_url: string;
  phone: string;
  email: string;
  location: string;
  birth_date?: string;
  education?: string;
  university?: string;
  political_status?: string;
  self_evaluation: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkExperience {
  id: string;
  resume_id: string;
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string;
  skills: string[];
  level?: string;
  sort_order: number;
  created_at?: string;
}

export interface Skill {
  id: string;
  resume_id: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  sort_order: number;
  created_at?: string;
}

export interface Honor {
  id: string;
  resume_id: string;
  name: string;
  sort_order: number;
  created_at?: string;
}

export interface DemoCourse {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  file_url?: string;
  file_name?: string;
  thumbnail_url?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

// 获取简历数据
export async function getResumeData(): Promise<ResumeData | null> {
  const { data, error } = await supabase
    .from('resume_data')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('获取简历数据失败:', error);
    return null;
  }
  return data;
}

// 获取工作经历
export async function getWorkExperiences(resumeId: string): Promise<WorkExperience[]> {
  const { data, error } = await supabase
    .from('work_experiences')
    .select('*')
    .eq('resume_id', resumeId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('获取工作经历失败:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

// 获取技能
export async function getSkills(resumeId: string): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('resume_id', resumeId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('获取技能失败:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

// 获取荣誉证书
export async function getHonors(resumeId: string): Promise<Honor[]> {
  const { data, error } = await supabase
    .from('honors')
    .select('*')
    .eq('resume_id', resumeId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('获取荣誉证书失败:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

// 更新简历数据
export async function updateResumeData(id: string, data: Partial<ResumeData>) {
  const { error } = await supabase
    .from('resume_data')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('更新简历数据失败:', error);
    throw error;
  }
}

// 上传图片到 Supabase Storage
export async function uploadImage(file: File): Promise<string> {
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的文件格式，请上传 JPEG、PNG、GIF、WEBP 或 AVIF 格式的图片');
  }

  // 验证文件大小（1MB）
  const maxSize = 1 * 1024 * 1024;
  let fileToUpload = file;

  if (file.size > maxSize) {
    // 压缩图片
    fileToUpload = await compressImage(file);
  }

  // 生成文件名（只包含字母和数字）
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `resume_${timestamp}_${randomStr}.${ext}`;

  // 上传到 Supabase Storage
  const { data, error } = await supabase.storage
    .from('app-8l4ah7uddr7k_resume_images')
    .upload(fileName, fileToUpload, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('上传图片失败:', error);
    throw error;
  }

  // 获取公开URL
  const { data: urlData } = supabase.storage
    .from('app-8l4ah7uddr7k_resume_images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// 压缩图片
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 限制最大分辨率为 1080p
        const maxDimension = 1080;
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // 转换为 WEBP 格式，质量 0.8
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          'image/webp',
          0.8
        );
      };
      img.onerror = () => reject(new Error('图片加载失败'));
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
  });
}

// ==================== 示范课程相关 API ====================

// 获取所有示范课程
export async function getDemoCourses(): Promise<DemoCourse[]> {
  const { data, error } = await supabase
    .from('demo_courses')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('获取示范课程失败:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

// 获取单个示范课程
export async function getDemoCourse(id: string): Promise<DemoCourse | null> {
  const { data, error } = await supabase
    .from('demo_courses')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('获取示范课程失败:', error);
    return null;
  }
  return data;
}

// 创建示范课程
export async function createDemoCourse(course: Partial<DemoCourse>) {
  const { data, error } = await supabase
    .from('demo_courses')
    .insert([course])
    .select()
    .single();

  if (error) {
    console.error('创建示范课程失败:', error);
    throw error;
  }
  return data;
}

// 更新示范课程
export async function updateDemoCourse(id: string, course: Partial<DemoCourse>) {
  const { error } = await supabase
    .from('demo_courses')
    .update({ ...course, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('更新示范课程失败:', error);
    throw error;
  }
}

// 删除示范课程
export async function deleteDemoCourse(id: string) {
  const { error } = await supabase
    .from('demo_courses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除示范课程失败:', error);
    throw error;
  }
}

// 上传视频到 Supabase Storage
export async function uploadVideo(file: File): Promise<string> {
  // 验证文件类型
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的视频格式，请上传 MP4、WEBM、OGG 或 MOV 格式的视频');
  }

  // 验证文件大小（100MB）
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('视频文件大小不能超过 100MB');
  }

  // 生成文件名（只包含字母和数字）
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop() || 'mp4';
  const fileName = `video_${timestamp}_${randomStr}.${ext}`;

  // 上传到 Supabase Storage
  const { data, error } = await supabase.storage
    .from('app-8l4ah7uddr7k_course_videos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('上传视频失败:', error);
    throw error;
  }

  // 获取公开URL
  const { data: urlData } = supabase.storage
    .from('app-8l4ah7uddr7k_course_videos')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// 上传文件到 Supabase Storage
export async function uploadCourseFile(file: File): Promise<{ url: string; name: string }> {
  // 验证文件类型
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的文件格式，请上传 PDF、Word、PowerPoint、Excel 或 TXT 格式的文件');
  }

  // 验证文件大小（50MB）
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('文件大小不能超过 50MB');
  }

  // 生成文件名（只包含字母和数字）
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop() || 'pdf';
  const fileName = `file_${timestamp}_${randomStr}.${ext}`;

  // 上传到 Supabase Storage
  const { data, error } = await supabase.storage
    .from('app-8l4ah7uddr7k_course_files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('上传文件失败:', error);
    throw error;
  }

  // 获取公开URL
  const { data: urlData } = supabase.storage
    .from('app-8l4ah7uddr7k_course_files')
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    name: file.name
  };
}
