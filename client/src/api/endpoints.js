import api from './axios';

export const AuthAPI = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data),
};

export const UsersAPI = {
  updateMe: (payload) => api.put('/users/me', payload).then((r) => r.data.data),
  deleteMe: () => api.delete('/users/me').then((r) => r.data),
  publicProfile: (id) => api.get(`/users/${id}`).then((r) => r.data.data),
};

export const CategoriesAPI = {
  list: () => api.get('/categories').then((r) => r.data.data),
  create: (payload) => api.post('/categories', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/categories/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};

export const ItemsAPI = {
  list: (params) => api.get('/items', { params }).then((r) => r.data.data),
  mine: () => api.get('/items/mine').then((r) => r.data.data),
  get: (id) => api.get(`/items/${id}`).then((r) => r.data.data),
  availability: (id) => api.get(`/items/${id}/availability`).then((r) => r.data.data),
  create: (payload) => api.post('/items', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/items/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/items/${id}`).then((r) => r.data),
  uploadImage: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/items/upload-image', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
  },
};

export const BookingsAPI = {
  create: (payload) => api.post('/bookings', payload).then((r) => r.data.data),
  mine: () => api.get('/bookings/mine').then((r) => r.data.data),
  incoming: () => api.get('/bookings/incoming').then((r) => r.data.data),
  get: (id) => api.get(`/bookings/${id}`).then((r) => r.data.data),
  update: (id, payload) => api.put(`/bookings/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/bookings/${id}`).then((r) => r.data),
  changeStatus: (id, payload) => api.patch(`/bookings/${id}/status`, payload).then((r) => r.data.data),
  review: (id, payload) => api.post(`/bookings/${id}/reviews`, payload).then((r) => r.data.data),
};

export const ReviewsAPI = {
  update: (id, payload) => api.put(`/reviews/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/reviews/${id}`).then((r) => r.data),
};

export const AdminAPI = {
  stats: () => api.get('/admin/stats').then((r) => r.data.data),
  users: () => api.get('/admin/users').then((r) => r.data.data),
  setUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data.data),
  items: () => api.get('/admin/items').then((r) => r.data.data),
};
