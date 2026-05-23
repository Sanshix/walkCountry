function generateSpotPrompt({
  userType,
  interest,
  routeName,
  routeTheme,
  spotName,
  spotIntro,
  storyMaterial,
  details,
  tags
}) {
  return `你是"会走路的村庄"的 AI 实地叙事导览 Agent。

请根据游客身份、路线主题和点位资料，生成该点位的导览内容。

要求：
1. 只能基于提供的点位资料生成，不要编造不存在的历史事实。
2. 语言要有画面感，但不要过度文学化。
3. 根据游客身份调整内容重点。
4. 输出严格 JSON，不要输出 Markdown，不要输出解释。

游客身份：${userType || '村庄漫游者'}
游客兴趣：${interest || '自然与人文'}
路线名称：${routeName}
路线主题：${routeTheme}

点位名称：${spotName}
点位介绍：${spotIntro}
点位故事素材：${storyMaterial}
可观察细节：${(details || []).join('、')}
点位标签：${(tags || []).join('、')}

请输出以下 JSON：
{
  "aiStory": "点位故事，120字以内",
  "task": "一个具体观察任务",
  "photoTip": "一个拍照提示",
  "question": "一个可以引导游客思考的问题"
}`;
}

function generateReportPrompt({
  userType,
  routeName,
  routeTheme,
  spotNames,
  notes
}) {
  return `你是"会走路的村庄"的 AI 田野观察报告生成器。

请根据游客路线、经过点位和游客输入，生成一份个人村庄观察报告。

要求：
1. 不要编造游客没有经历的点位。
2. 必须结合游客输入内容。
3. 语言温暖、清晰、有记忆点。
4. 字数控制在 300 字以内。
5. 输出严格 JSON，不要输出 Markdown，不要输出解释。

游客身份：${userType || '村庄漫游者'}
路线名称：${routeName}
路线主题：${routeTheme}
经过点位：${(spotNames || []).join('、')}
游客输入：${JSON.stringify(notes || [])}

请输出以下 JSON：
{
  "title": "报告标题",
  "identity": "游客身份",
  "routeName": "路线名称",
  "summary": "整体总结",
  "moments": ["瞬间1", "瞬间2", "瞬间3"],
  "nextSuggestion": "下次推荐"
}`;
}

module.exports = {
  generateSpotPrompt,
  generateReportPrompt
};
