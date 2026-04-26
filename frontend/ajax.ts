import $ from 'jquery'

import { cookieJar } from './cookies'

const AJAX_TIMEOUT = 2500

function smmGet(url: string, data?: object, success?: (data: unknown) => void, error?: () => void) {
  return $.ajax({
    url,
    data,
    timeout: AJAX_TIMEOUT,
    success: success,
    error: error
  })
}

function smmGetJSON(url: string, data?: object, success?: (data: unknown) => void, error?: () => void) {
  return $.ajax({
    url,
    data,
    dataType: 'json',
    timeout: AJAX_TIMEOUT,
    success: success,
    error: error
  })
}

function smmPost(url: string, data: object, success?: (data: unknown) => void, error?: () => void) {
  return $.ajax({
    url,
    type: 'POST',
    headers: {
      'X-CSRFToken': cookieJar.get('csrftoken') ?? ''
    },
    data: data,
    timeout: AJAX_TIMEOUT,
    success: success,
    error: error
  })
}

function smmPostBody(url: string, body: FormData | URLSearchParams, success?: (data: unknown) => void, error?: () => void) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'X-CSRFToken': cookieJar.get('csrftoken') ?? ''
    },
    body: body,
    timeout: AJAX_TIMEOUT
  })
    .then((response) => {
      if (!response.ok) throw response
      if (success) success(response.text())
    })
    .catch(() => {
      if (error) error()
    })
}

function smmDelete(url: string, success?: (data: never) => void, error?: () => void) {
  $.ajax({
    url: url,
    type: 'DELETE',
    headers: {
      'X-CSRFToken': cookieJar.get('csrftoken') ?? ''
    },
    timeout: AJAX_TIMEOUT,
    success: success,
    error: error
  })
}

export { smmGet, smmGetJSON, smmPost, smmPostBody, smmDelete }
