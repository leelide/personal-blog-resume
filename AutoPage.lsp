(defun c:UpdatePage (/ layouts layout-list ss i ent attr count)
  (vl-load-com)
  (setvar "CMDECHO" 0)
  
  ;; 1. 取得所有配置物件並根據真實順序 (TabOrder) 排序
  (setq layout-list nil)
  (vlax-for lay (vla-get-layouts (vla-get-activedocument (vlax-get-acad-object)))
    (if (/= (vla-get-name lay) "Model") ;; 排除模型空間
      (setq layout-list (cons (list (vla-get-taborder lay) (vla-get-name lay)) layout-list))
    )
  )
  ;; 根據 TabOrder 數字從小到大排序
  (setq layout-list (vl-sort layout-list '(lambda (a b) (< (car a) (car b)))))

  ;; 2. 依照排序後的順序開始更新頁碼
  (setq count 1)
  (foreach lay-info layout-list
    (setq layout (cadr lay-info))
    (setvar "CTAB" layout) ;; 切換分頁
    (princ (strcat "\n順序 " (itoa count) " 正在處理: " layout))
    
    ;; 3. 尋找該配置中的 PAGE_NO 並更新
    (if (setq ss (ssget "X" (list '(0 . "INSERT") '(66 . 1) (cons 410 layout))))
      (progn
        (setq i 0)
        (repeat (sslength ss)
          (setq ent (ssname ss i))
          (setq attr (entnext ent))
          (while (and attr (/= (cdr (assoc 0 (entget attr))) "SEQEND"))
            (if (= (vl-string-trim " " (strcase (cdr (assoc 2 (entget attr))))) "PAGE_NO")
              (progn
                (entmod (subst (cons 1 (itoa count)) (assoc 1 (entget attr)) (entget attr)))
                (entupd ent)
              )
            )
            (setq attr (entnext attr))
          )
          (setq i (1+ i))
        )
      )
    )
    (setq count (1+ count))
  )
  (princ "\n全部頁碼已依照標籤順序更新完成！")
  (princ)
)