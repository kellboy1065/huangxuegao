import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Upload, Loader2 } from 'lucide-react';
import { getResumeData, updateResumeData, uploadImage, type ResumeData } from '@/db/api';
import { toast } from 'sonner';

export default function AdminEditPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    subtitle: '',
    description: '',
    photo_url: '',
    phone: '',
    email: '',
    location: '',
    self_evaluation: ''
  });

  useEffect(() => {
    // 检查是否为管理员
    if (profile && profile.role !== 'admin') {
      navigate('/');
      return;
    }

    loadResumeData();
  }, [profile, navigate]);

  const loadResumeData = async () => {
    try {
      const data = await getResumeData();
      if (data) {
        setResumeData(data);
        setFormData({
          name: data.name,
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          photo_url: data.photo_url,
          phone: data.phone,
          email: data.email,
          location: data.location,
          self_evaluation: data.self_evaluation
        });
      }
    } catch (error) {
      console.error('加载简历数据失败:', error);
      toast.error('加载简历数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, photo_url: url }));
      toast.success('图片上传成功');
    } catch (error) {
      console.error('图片上传失败:', error);
      toast.error(error instanceof Error ? error.message : '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!resumeData) return;

    setSaving(true);
    try {
      await updateResumeData(resumeData.id, formData);
      toast.success('保存成功');
      navigate('/');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 xl:px-12 py-3 xl:py-6">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-sm xl:text-lg font-bold tracking-wider">编辑简历</h1>
            <div className="flex gap-2 xl:gap-4">
              <Button variant="outline" onClick={() => navigate('/')} size="sm" className="text-xs xl:text-sm">
                <ArrowLeft className="w-3 h-3 xl:w-4 xl:h-4 xl:mr-2" />
                返回
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm" className="text-xs xl:text-sm">
                <Save className="w-3 h-3 xl:w-4 xl:h-4 xl:mr-2" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 编辑表单 */}
      <div className="container mx-auto px-4 xl:px-12 py-6 xl:py-12 max-w-4xl">
        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>编辑个人基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">职位标题</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">副标题</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">个人描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* 照片上传 */}
          <Card>
            <CardHeader>
              <CardTitle>个人照片</CardTitle>
              <CardDescription>上传个人照片（支持 JPEG、PNG、GIF、WEBP、AVIF 格式，最大 1MB）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col xl:flex-row items-start gap-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border-2 border-border">
                  <img
                    src={formData.photo_url}
                    alt="预览"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="photo">选择图片</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </div>
                  {uploading && (
                    <Alert>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <AlertDescription>正在上传图片...</AlertDescription>
                    </Alert>
                  )}
                  <p className="text-xs text-muted-foreground">
                    如果图片超过 1MB，系统会自动压缩为 WEBP 格式
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 联系方式 */}
          <Card>
            <CardHeader>
              <CardTitle>联系方式</CardTitle>
              <CardDescription>编辑联系信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号码</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">电子邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">所在地</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 自我评价 */}
          <Card>
            <CardHeader>
              <CardTitle>自我评价</CardTitle>
              <CardDescription>编辑自我评价内容</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.self_evaluation}
                onChange={(e) => handleInputChange('self_evaluation', e.target.value)}
                rows={5}
              />
            </CardContent>
          </Card>

          {/* 保存按钮 */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '保存更改'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
