import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Download, Plus, Loader2 } from 'lucide-react';
import { getDemoCourses, type DemoCourse } from '@/db/api';

export default function DemoCoursePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<DemoCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<DemoCourse | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await getDemoCourses();
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourse(data[0]);
      }
    } catch (error) {
      console.error('加载课程失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = profile?.role === 'admin';

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
            <h1 className="text-sm xl:text-lg font-bold tracking-wider">示范课程</h1>
            <div className="flex gap-2 xl:gap-4">
              <Button variant="outline" onClick={() => navigate('/')} size="sm" className="text-xs xl:text-sm">
                <ArrowLeft className="w-3 h-3 xl:w-4 xl:h-4 xl:mr-2" />
                <span className="hidden xl:inline">返回</span>首页
              </Button>
              {isAdmin && (
                <Button onClick={() => navigate('/admin/courses')} size="sm" className="text-xs xl:text-sm">
                  <Plus className="w-3 h-3 xl:w-4 xl:h-4 xl:mr-2" />
                  <span className="hidden xl:inline">管理</span>课程
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 课程内容 */}
      <div className="container mx-auto px-6 xl:px-12 py-8 xl:py-12">
        {courses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-6">暂无示范课程</p>
            {isAdmin && (
              <Button onClick={() => navigate('/admin/courses')}>
                <Plus className="w-4 h-4 mr-2" />
                添加课程
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
            {/* 左侧：课程列表 */}
            <div className="xl:col-span-4 space-y-3 xl:space-y-4">
              <h2 className="text-base xl:text-lg font-bold text-foreground mb-3 xl:mb-4">课程列表</h2>
              <div className="space-y-3 xl:space-y-4">
                {courses.map((course) => (
                  <Card
                    key={course.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedCourse?.id === course.id ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <CardHeader className="pb-2 xl:pb-3 p-4 xl:p-6">
                      <CardTitle className="text-sm xl:text-base leading-tight">{course.title}</CardTitle>
                      {course.description && (
                        <CardDescription className="text-xs xl:text-sm line-clamp-2 mt-1 xl:mt-2">
                          {course.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 xl:p-6 pt-0">
                      <div className="flex gap-2">
                        {course.video_url && (
                          <Badge variant="secondary" className="text-xs">
                            <Play className="w-3 h-3 mr-1" />
                            视频
                          </Badge>
                        )}
                        {course.file_url && (
                          <Badge variant="secondary" className="text-xs">
                            <Download className="w-3 h-3 mr-1" />
                            文件
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* 右侧：课程详情 */}
            <div className="xl:col-span-8">
              {selectedCourse ? (
                <div className="space-y-4 xl:space-y-6">
                  <div>
                    <h2 className="text-xl xl:text-2xl font-bold text-foreground mb-3 xl:mb-4">
                      {selectedCourse.title}
                    </h2>
                    {selectedCourse.description && (
                      <p className="text-sm xl:text-base text-muted-foreground leading-relaxed">
                        {selectedCourse.description}
                      </p>
                    )}
                  </div>

                  {/* 视频播放器 */}
                  {selectedCourse.video_url && (
                    <Card>
                      <CardContent className="p-0">
                        <video
                          controls
                          controlsList="nodownload"
                          className="w-full rounded-lg aspect-video bg-black"
                          src={selectedCourse.video_url}
                          preload="metadata"
                        >
                          <track kind="captions" />
                          您的浏览器不支持视频播放
                        </video>
                      </CardContent>
                    </Card>
                  )}

                  {/* 文件下载 */}
                  {selectedCourse.file_url && (
                    <Card>
                      <CardHeader className="p-4 xl:p-6">
                        <CardTitle className="text-base xl:text-lg">课程资料</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 xl:p-6 pt-0">
                        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 xl:gap-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Download className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {selectedCourse.file_name || '课程资料'}
                              </p>
                              <p className="text-xs text-muted-foreground">点击下载</p>
                            </div>
                          </div>
                          <Button asChild className="w-full xl:w-auto">
                            <a href={selectedCourse.file_url} download target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-2" />
                              下载
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">请选择一个课程</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
