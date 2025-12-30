import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Upload, Video, FileText } from 'lucide-react';
import { 
  getDemoCourses, 
  createDemoCourse, 
  updateDemoCourse, 
  deleteDemoCourse,
  uploadVideo,
  uploadCourseFile,
  type DemoCourse 
} from '@/db/api';
import { toast } from 'sonner';

export default function AdminCoursePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<DemoCourse[]>([]);
  const [editingCourse, setEditingCourse] = useState<DemoCourse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    file_url: '',
    file_name: ''
  });

  useEffect(() => {
    // 检查是否为管理员
    if (profile && profile.role !== 'admin') {
      navigate('/');
      return;
    }
    loadCourses();
  }, [profile, navigate]);

  const loadCourses = async () => {
    try {
      const data = await getDemoCourses();
      setCourses(data);
    } catch (error) {
      console.error('加载课程失败:', error);
      toast.error('加载课程失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (course?: DemoCourse) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description || '',
        video_url: course.video_url || '',
        file_url: course.file_url || '',
        file_name: course.file_name || ''
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        description: '',
        video_url: '',
        file_url: '',
        file_name: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadVideo(file);
      setFormData(prev => ({ ...prev, video_url: url }));
      toast.success('视频上传成功');
    } catch (error) {
      console.error('视频上传失败:', error);
      toast.error(error instanceof Error ? error.message : '视频上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url, name } = await uploadCourseFile(file);
      setFormData(prev => ({ ...prev, file_url: url, file_name: name }));
      toast.success('文件上传成功');
    } catch (error) {
      console.error('文件上传失败:', error);
      toast.error(error instanceof Error ? error.message : '文件上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入课程标题');
      return;
    }

    setUploading(true);
    try {
      if (editingCourse) {
        await updateDemoCourse(editingCourse.id, formData);
        toast.success('课程更新成功');
      } else {
        await createDemoCourse({
          ...formData,
          sort_order: courses.length
        });
        toast.success('课程创建成功');
      }
      setIsDialogOpen(false);
      loadCourses();
    } catch (error) {
      console.error('保存课程失败:', error);
      toast.error('保存课程失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个课程吗？')) return;

    try {
      await deleteDemoCourse(id);
      toast.success('课程删除成功');
      loadCourses();
    } catch (error) {
      console.error('删除课程失败:', error);
      toast.error('删除课程失败');
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
            <h1 className="text-sm xl:text-lg font-bold tracking-wider">课程管理</h1>
            <div className="flex gap-2 xl:gap-4">
              <Button variant="outline" onClick={() => navigate('/courses')} size="sm" className="text-xs xl:text-sm">
                <ArrowLeft className="w-3 h-3 xl:w-4 xl:h-4 xl:mr-2" />
                <span className="hidden xl:inline">返回</span>课程
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()} size="sm" className="text-xs xl:text-sm">
                    <Plus className="w-3 h-3 xl:w-4 xl:h-4 xl:mr-2" />
                    <span className="hidden xl:inline">添加</span>课程
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] xl:w-full">
                  <DialogHeader>
                    <DialogTitle className="text-base xl:text-lg">{editingCourse ? '编辑课程' : '添加课程'}</DialogTitle>
                    <DialogDescription className="text-sm">
                      填写课程信息并上传视频和文件
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {/* 课程标题 */}
                    <div className="space-y-2">
                      <Label htmlFor="title">课程标题 *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="请输入课程标题"
                      />
                    </div>

                    {/* 课程描述 */}
                    <div className="space-y-2">
                      <Label htmlFor="description">课程描述</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="请输入课程描述"
                        rows={3}
                      />
                    </div>

                    {/* 视频上传 */}
                    <div className="space-y-2">
                      <Label htmlFor="video">上传视频</Label>
                      <div className="space-y-2">
                        <Input
                          id="video"
                          type="file"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime"
                          onChange={handleVideoUpload}
                          disabled={uploading}
                        />
                        {formData.video_url && (
                          <Alert>
                            <Video className="w-4 h-4" />
                            <AlertDescription>视频已上传</AlertDescription>
                          </Alert>
                        )}
                        <p className="text-xs text-muted-foreground">
                          支持 MP4、WEBM、OGG、MOV 格式，最大 100MB
                        </p>
                      </div>
                    </div>

                    {/* 文件上传 */}
                    <div className="space-y-2">
                      <Label htmlFor="file">上传课程资料</Label>
                      <div className="space-y-2">
                        <Input
                          id="file"
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        {formData.file_url && (
                          <Alert>
                            <FileText className="w-4 h-4" />
                            <AlertDescription>
                              文件已上传：{formData.file_name}
                            </AlertDescription>
                          </Alert>
                        )}
                        <p className="text-xs text-muted-foreground">
                          支持 PDF、Word、PowerPoint、Excel、TXT 格式，最大 50MB
                        </p>
                      </div>
                    </div>

                    {uploading && (
                      <Alert>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <AlertDescription>正在上传...</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleSave} disabled={uploading}>
                      {uploading ? '保存中...' : '保存'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </nav>

      {/* 课程列表 */}
      <div className="container mx-auto px-6 xl:px-12 py-8 xl:py-12">
        {courses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-6">暂无课程，点击上方按钮添加课程</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg xl:text-xl">{course.title}</CardTitle>
                      {course.description && (
                        <CardDescription className="mt-2 line-clamp-2">
                          {course.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(course)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(course.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {course.video_url && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video className="w-4 h-4" />
                        <span>已上传视频</span>
                      </div>
                    )}
                    {course.file_url && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>{course.file_name || '已上传文件'}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
