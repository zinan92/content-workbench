export type Locale = 'zh' | 'en';

const translations = {
  // Layout
  'app.title': { zh: '内容分发工作台', en: 'Content Replication Workbench' },
  'app.subtitle': { zh: '手动多平台内容分发工具', en: 'Manual multi-platform content replication tool' },

  // Home page
  'home.title': { zh: '内容分发工作台', en: 'Content Replication Workbench' },
  'home.description': { zh: '输入抖音创作者主页或单条视频链接开始', en: 'Enter a Douyin creator profile or single video link to begin' },
  'home.inputLabel': { zh: '抖音链接', en: 'Douyin Link' },
  'home.unsupportedLink': { zh: '不支持的链接', en: 'Unsupported Link' },
  'home.resolutionFailed': { zh: '解析失败', en: 'Resolution Failed' },
  'home.error': { zh: '出错了', en: 'Error' },
  'home.retryHint': { zh: '可以用同一链接重试，或输入其他链接。', en: 'You can try again with the same link or enter a different one.' },
  'home.detected': { zh: '识别为：', en: 'Detected: ' },
  'home.creatorProfile': { zh: '创作者主页', en: 'Creator Profile' },
  'home.singleVideo': { zh: '单条视频', en: 'Single Video' },
  'home.processing': { zh: '处理中...', en: 'Processing...' },
  'home.continue': { zh: '继续', en: 'Continue' },
  'home.supportedLinks': { zh: '支持的链接格式', en: 'Supported Links' },
  'home.creatorProfileLabel': { zh: '创作者主页：', en: 'Creator Profile:' },
  'home.singleVideoLabel': { zh: '单条视频：', en: 'Single Video:' },
  'home.networkError': { zh: '网络错误，请检查网络连接后重试。', en: 'Network error. Please check your connection and try again.' },

  // Auth
  'auth.loading': { zh: '加载中...', en: 'Loading...' },
  'auth.signIn': { zh: '登录账号', en: 'Sign in to your account' },
  'auth.signUp': { zh: '创建新账号', en: 'Create a new account' },
  'auth.accessWorkbench': { zh: '访问内容分发工作台', en: 'Access the Content Replication Workbench' },
  'auth.email': { zh: '邮箱地址', en: 'Email address' },
  'auth.password': { zh: '密码', en: 'Password' },
  'auth.accountCreated': { zh: '账号已创建！请检查邮箱确认。', en: 'Account created! Please check your email to confirm.' },
  'auth.unexpectedError': { zh: '发生意外错误，请重试。', en: 'An unexpected error occurred. Please try again.' },
  'auth.pleaseWait': { zh: '请稍候...', en: 'Please wait...' },
  'auth.signInBtn': { zh: '登录', en: 'Sign in' },
  'auth.signUpBtn': { zh: '注册', en: 'Sign up' },
  'auth.noAccount': { zh: '没有账号？注册', en: "Don't have an account? Sign up" },
  'auth.hasAccount': { zh: '已有账号？登录', en: 'Already have an account? Sign in' },

  // Studio page
  'studio.title': { zh: '单条视频工作台', en: 'Single Video Studio' },
  'studio.backToPrep': { zh: '返回准备页', en: 'Back to Preparation' },
  'studio.loading': { zh: '加载工作台...', en: 'Loading studio...' },
  'studio.error': { zh: '出错了', en: 'Error' },
  'studio.goBack': { zh: '返回', en: 'Go Back' },
  'studio.notFound': { zh: '未找到该内容', en: 'Item not found' },
  'studio.sourceRef': { zh: '素材参考', en: 'Source Reference' },
  'studio.videoPreview': { zh: '视频预览', en: 'Video Preview' },
  'studio.videoPreviewIcon': { zh: '📹 视频预览', en: '📹 Video Preview' },
  'studio.noVideo': { zh: '暂无视频', en: 'No video available' },
  'studio.metadata': { zh: '元数据', en: 'Metadata' },
  'studio.metaTitle': { zh: '标题', en: 'Title' },
  'studio.metaAuthor': { zh: '作者', en: 'Author' },
  'studio.metaPublished': { zh: '发布日期', en: 'Published' },
  'studio.metaDuration': { zh: '时长', en: 'Duration' },
  'studio.metaSourceUrl': { zh: '来源链接', en: 'Source URL' },
  'studio.engagement': { zh: '互动数据', en: 'Engagement' },
  'studio.views': { zh: '播放', en: 'Views' },
  'studio.likes': { zh: '点赞', en: 'Likes' },
  'studio.comments': { zh: '评论', en: 'Comments' },
  'studio.shares': { zh: '分享', en: 'Shares' },
  'studio.transcript': { zh: '文字稿', en: 'Transcript' },
  'studio.transcriptPath': { zh: '文件路径：', en: 'Available at:' },
  'studio.noTranscript': { zh: '暂无文字稿', en: 'No transcript available' },
  'studio.sourceContext': { zh: '来源评估', en: 'Source Context' },
  'studio.score': { zh: '评分：', en: 'Score:' },
  'studio.recommended': { zh: '推荐：', en: 'Recommended:' },
  'studio.yes': { zh: '是', en: 'Yes' },
  'studio.no': { zh: '否', en: 'No' },
  'studio.draft': { zh: '草稿', en: 'Draft' },
  'studio.minOutputs': { zh: '最少产出：', en: 'Minimum outputs: ' },
  'studio.checklist': { zh: '检查清单', en: 'Checklist' },
  'studio.saving': { zh: '保存中...', en: 'Saving...' },
  'studio.saveDraft': { zh: '保存草稿', en: 'Save Draft' },
  'studio.saved': { zh: '草稿已保存', en: 'Draft saved successfully' },
  'studio.saveFailed': { zh: '保存失败', en: 'Failed to save draft' },
  'studio.nextPlatform': { zh: '下一个平台 →', en: 'Next Platform →' },
  'studio.nextVideo': { zh: '下一条待处理视频 →', en: 'Next Ready Video →' },

  // XiaoHongShu fields
  'xhs.searchTitle': { zh: '搜索关键词标题', en: 'Search-Keyword Title' },
  'xhs.searchTitlePlaceholder': { zh: '围绕搜索意图改写标题（用户会搜的关键词）...', en: 'Rewrite the title toward search intent (keywords XHS users search for)...' },
  'xhs.searchTitleHint': { zh: '小红书靠搜索发现内容，标题要包含用户会搜的关键词。', en: 'XHS discovery is search-driven. Include keywords users would search for.' },
  'xhs.captionDraft': { zh: '小红书文案草稿', en: 'XHS Caption Draft' },
  'xhs.captionPlaceholder': { zh: '改编为小红书风格（口语化、多 emoji、多话题标签）...', en: 'Adapt caption for XHS style (conversational, emoji-friendly, hashtag-rich)...' },
  'xhs.keyframeCandidates': { zh: '关键帧/封面候选', en: 'Keyframe / Cover Candidates' },
  'xhs.keyframePlaceholder': { zh: '记录适合做封面的关键帧时间戳或文件名...', en: 'Note timestamps or filenames of good keyframes for the XHS cover image...' },
  'xhs.keyframeHint': { zh: '小红书封面决定点击率，选出原视频中最好的画面。', en: 'XHS covers drive click-through. Note the best frames from the source video.' },
  'xhs.coverNotes': { zh: '封面备注', en: 'Cover Notes' },
  'xhs.coverPlaceholder': { zh: '封面相关备注：文字叠加方案、裁剪建议...', en: 'Additional notes about the cover: text overlay ideas, crop guidance...' },

  // Bilibili / Video Channel fields
  'repost.title': { zh: '转发标题', en: 'Repost Title' },
  'repost.titlePlaceholder': { zh: '可直接转发的标题...', en: 'Repost-ready title...' },
  'repost.description': { zh: '视频简介', en: 'Video Description' },
  'repost.descriptionPlaceholder': { zh: '输入视频简介...', en: 'Enter video description...' },

  // WeChat OA fields
  'wechat.articleTitle': { zh: '文章标题', en: 'Article Title' },
  'wechat.articleTitlePlaceholder': { zh: '公众号文章标题...', en: 'Article title for Official Account...' },
  'wechat.articleBody': { zh: '文章正文', en: 'Article Body' },
  'wechat.articleBodyPlaceholder': { zh: '根据视频内容改写文章正文...', en: 'Draft the article text adapted from the video content...' },

  // X fields
  'x.postText': { zh: '帖子内容', en: 'Post Text' },
  'x.postPlaceholder': { zh: '短文帖子（简洁有力）...', en: 'Short-form post text (concise, engaging)...' },
  'x.charCount': { zh: '字符', en: 'characters' },

  // Platform configs
  'platform.xiaohongshu': { zh: '小红书', en: 'XiaoHongShu' },
  'platform.xiaohongshu.desc': { zh: '搜索关键词标题、改编文案、封面/关键帧候选', en: 'Search-keyword title, adapted caption, cover/keyframe candidate' },
  'platform.xiaohongshu.out1': { zh: '搜索导向标题', en: 'Search-oriented title' },
  'platform.xiaohongshu.out2': { zh: '小红书文案草稿', en: 'XHS caption draft' },
  'platform.xiaohongshu.out3': { zh: '封面/关键帧候选', en: 'Cover / keyframe candidate' },
  'platform.xiaohongshu.check1': { zh: '搜索关键词标题已完成', en: 'Search-keyword title written' },
  'platform.xiaohongshu.check2': { zh: '文案已适配小红书风格', en: 'Caption adapted for XHS' },
  'platform.xiaohongshu.check3': { zh: '封面/关键帧已选定', en: 'Cover / keyframe selected' },
  'platform.readyToPublish': { zh: '可以发布', en: 'Ready to publish' },

  'platform.bilibili': { zh: 'B站', en: 'Bilibili' },
  'platform.bilibili.desc': { zh: '转发标题和简介', en: 'Repost-ready title and description' },
  'platform.bilibili.out1': { zh: '转发标题', en: 'Repost-ready title' },
  'platform.bilibili.out2': { zh: '视频简介', en: 'Video description' },
  'platform.bilibili.check1': { zh: '标题已更新', en: 'Title updated' },
  'platform.bilibili.check2': { zh: '简介已完成', en: 'Description written' },

  'platform.videoChannel': { zh: '视频号', en: 'Video Channel' },
  'platform.videoChannel.desc': { zh: '微信视频号转发标题和简介', en: 'Repost-ready title and description for WeChat Video' },

  'platform.wechatOa': { zh: '公众号', en: 'WeChat OA' },
  'platform.wechatOa.desc': { zh: '公众号文章草稿', en: 'Article / text draft for Official Account' },
  'platform.wechatOa.out1': { zh: '文章标题', en: 'Article title' },
  'platform.wechatOa.out2': { zh: '文章正文草稿', en: 'Article body / text draft' },
  'platform.wechatOa.check1': { zh: '文章标题已设置', en: 'Article title set' },
  'platform.wechatOa.check2': { zh: '文章正文已完成', en: 'Article body drafted' },

  'platform.x.desc': { zh: '短文帖子草稿', en: 'Short-form post draft' },
  'platform.x.out1': { zh: '短文帖子', en: 'Short-form post text' },
  'platform.x.check1': { zh: '帖子已起草', en: 'Post text drafted' },

  // Session page
  'session.error': { zh: '出错了', en: 'Error' },
  'session.notFound': { zh: '未找到该会话', en: 'Session not found' },
  'session.candidateReview': { zh: '候选视频审核', en: 'Candidate Review' },
  'session.session': { zh: '会话', en: 'Session' },
  'session.inputType': { zh: '输入类型：', en: 'Input Type: ' },
  'session.phase': { zh: '阶段：', en: 'Phase: ' },
  'session.link': { zh: '链接：', en: 'Link: ' },
  'session.partialResults': { zh: '部分结果', en: 'Partial Results' },
  'session.partialResultsDesc': { zh: '发现阶段只返回了部分内容。你仍可以从下方候选视频中筛选。', en: 'Discovery returned only part of the available content. You can still review and select from the candidates shown below.' },
  'session.discoveredVideos': { zh: '已发现视频', en: 'Discovered Videos' },
  'session.preparing': { zh: '准备中...', en: 'Preparing...' },
  'session.prepareSelected': { zh: '准备选中项', en: 'Prepare Selected' },

  // Preparation page
  'prep.error': { zh: '出错了', en: 'Error' },
  'prep.notFound': { zh: '未找到该会话', en: 'Session not found' },
  'prep.title': { zh: '准备状态', en: 'Preparation Status' },
  'prep.preparingItems': { zh: '正在准备 {count} 条内容', en: 'Preparing {count} items' },
  'prep.pending': { zh: '待处理', en: 'Pending' },
  'prep.downloading': { zh: '下载中', en: 'Downloading' },
  'prep.transcribing': { zh: '转写中', en: 'Transcribing' },
  'prep.ready': { zh: '就绪', en: 'Ready' },
  'prep.failed': { zh: '失败', en: 'Failed' },
  'prep.video': { zh: '视频：', en: 'Video: ' },
  'prep.transcript': { zh: '文字稿：', en: 'Transcript: ' },
  'prep.retrying': { zh: '重试中...', en: 'Retrying...' },
  'prep.retry': { zh: '重试', en: 'Retry' },
  'prep.openStudio': { zh: '进入工作台', en: 'Open Studio' },
  'prep.noItems': { zh: '没有待准备的内容', en: 'No items to prepare' },
  'prep.noItemsDesc': { zh: '从候选视频审核页面选择内容后开始准备。', en: 'Select items from candidate review to begin preparation.' },

  // Candidate table
  'table.noResults': { zh: '未找到候选视频。', en: 'No candidates found.' },
  'table.recommendedOnly': { zh: '仅显示推荐', en: 'Recommended only' },
  'table.title': { zh: '标题', en: 'Title' },
  'table.published': { zh: '发布日期', en: 'Published' },
  'table.duration': { zh: '时长', en: 'Duration' },
  'table.views': { zh: '播放', en: 'Views' },
  'table.likes': { zh: '点赞', en: 'Likes' },
  'table.comments': { zh: '评论', en: 'Comments' },
  'table.shares': { zh: '分享', en: 'Shares' },
  'table.score': { zh: '评分', en: 'Score' },
  'table.recommended': { zh: '推荐', en: 'Recommended' },
  'table.yes': { zh: '✓ 是', en: '✓ Yes' },
} as const;

export type TranslationKey = keyof typeof translations;

export function getTranslation(key: TranslationKey, locale: Locale): string {
  return translations[key][locale];
}

export default translations;
