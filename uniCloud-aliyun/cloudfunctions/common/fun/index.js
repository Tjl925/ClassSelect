let db = uniCloud.database({
  throwOnNotFound: false,
});
const dbCmd = db.command
if (event.api === 'getCourses') {
  return await db.collection('course-info').get()
}