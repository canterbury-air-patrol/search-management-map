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

export { smmGet, smmGetJSON, smmPost, smmDelete }
