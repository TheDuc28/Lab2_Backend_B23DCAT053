"use strict";

// These functions construct ordinary JavaScript response objects. Do NOT return
// Mongoose documents directly: API models are intentionally more restricted.
const idOf = (id) => String(id);

function userListModel(user) {
  return {
    _id: idOf(user._id),
    first_name: user.first_name,
    last_name: user.last_name,
  };
}

function userDetailModel(user) {
  return {
    ...userListModel(user),
    location: user.location,
    description: user.description,
    occupation: user.occupation,
  };
}

function photoModel(photo, authorsById) {
  return {
    _id: idOf(photo._id),
    user_id: idOf(photo.user_id),
    file_name: photo.file_name,
    date_time: photo.date_time,
    comments: (photo.comments || []).map((comment) => ({
      _id: idOf(comment._id),
      comment: comment.comment,
      date_time: comment.date_time,
      // Exactly the three fields required for the comment's author.
      user: authorsById.get(idOf(comment.user_id)) || null,
    })),
  };
}

function statsModels(users, photos) {
  const byId = new Map(users.map((u) => [idOf(u._id), {
    user_id: idOf(u._id), photo_count: 0, comment_count: 0,
  }]));
  for (const photo of photos) {
    const owner = byId.get(idOf(photo.user_id));
    if (owner) owner.photo_count += 1;
    for (const comment of photo.comments || []) {
      const author = byId.get(idOf(comment.user_id));
      if (author) author.comment_count += 1;
    }
  }
  return [...byId.values()];
}

function commentModels(photos, authorId) {
  const result = [];
  for (const photo of photos) {
    for (const comment of photo.comments || []) {
      if (idOf(comment.user_id) !== idOf(authorId)) continue;
      result.push({
        _id: idOf(comment._id),
        comment: comment.comment,
        date_time: comment.date_time,
        photo: {
          _id: idOf(photo._id),
          user_id: idOf(photo.user_id),
          file_name: photo.file_name,
          date_time: photo.date_time,
        },
      });
    }
  }
  return result.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
}

module.exports = { userListModel, userDetailModel, photoModel, statsModels, commentModels };
