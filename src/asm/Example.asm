.DATA	0x0
	a:	.word 0x0
.TEXT	0x0
	func:
	addiu	$sp, $sp, -48
	sw	$s0, 16($sp)
	sw	$s1, 20($sp)
	sw	$s2, 24($sp)
	sw	$s3, 28($sp)
	sw	$s4, 32($sp)
	sw	$s5, 36($sp)
	sw	$s6, 40($sp)
	sw	$s7, 44($sp)
	sw	$a0, 48($sp)
	sw	$a1, 52($sp)
	lw	$t0, 48($sp)
	lw	$t1, 52($sp)
	div	$t0, $t1
	mflo	$t2
	sw	$t2, 4($sp)
	lw	$s0, 16($sp)
	lw	$s1, 20($sp)
	lw	$s2, 24($sp)
	lw	$s3, 28($sp)
	lw	$s4, 32($sp)
	lw	$s5, 36($sp)
	lw	$s6, 40($sp)
	lw	$s7, 44($sp)
	addiu	$sp, $sp, 48
	jr	$ra
	foo:
	addiu	$sp, $sp, -40
	sw	$s0, 8($sp)
	sw	$s1, 12($sp)
	sw	$s2, 16($sp)
	sw	$s3, 20($sp)
	sw	$s4, 24($sp)
	sw	$s5, 28($sp)
	sw	$s6, 32($sp)
	sw	$s7, 36($sp)
	sw	$a0, 40($sp)
	addiu	$t0, $zero, 2
	mov	$v0, $t0
	lw	$s0, 8($sp)
	lw	$s1, 12($sp)
	lw	$s2, 16($sp)
	lw	$s3, 20($sp)
	lw	$s4, 24($sp)
	lw	$s5, 28($sp)
	lw	$s6, 32($sp)
	lw	$s7, 36($sp)
	addiu	$sp, $sp, 40
	jr	$ra
	main:
	addiu	$sp, $sp, -64
	sw	$ra, 60($sp)
	sw	$s0, 32($sp)
	sw	$s1, 36($sp)
	sw	$s2, 40($sp)
	sw	$s3, 44($sp)
	sw	$s4, 48($sp)
	sw	$s5, 52($sp)
	sw	$s6, 56($sp)
	sw	$s7, 60($sp)
	addiu	$t0, $zero, 10
	addiu	$t1, $zero, 20
_label_6_loop:
	slt	$t2, $t1, $t0
	beq	$t2, $zero, _label_7_break
	nop
	addiu	$t3, $zero, 15
	addiu	$t4, $zero, 0x00
	addiu	$t5, $zero, 1
	sw	_var_13, $t5
_label_8_loop:
	addiu	$t6, $zero, 1
	sub	$t7, $t3, $t6
	nor	$t7, $t3, $t6
	beq	$t7, $zero, _label_9_break
	nop
	addiu	$t8, $zero, 2
	mult	$t1, $t8
	mflo	$t9
	sw	$t3, 16($sp)
	sw	$t9, 20($sp)
	mov	$a0, $t9
	jal	foo
	lw	$a0, 20($sp)
	jal	foo
	mov	$t2, $v0
	j	_label_9_break
	nop
	j	_label_8_loop
	nop
_label_9_break:
	lw	$t3, 20($sp)
	slt	$t4, $t3, $t2
_label_10_true:
	beq	$t4, $zero, _label_11_false
	nop
	add	$t5, $t3, $t2
	j	_label_6_loop
	nop
_label_11_false:
	slt	$t6, $t2, $t5
_label_12_true:
	beq	$t6, $zero, _label_13_false
	nop
	j	_label_7_break
	nop
_label_13_false:
	xor	$t7, $t2, $t5
	xor,	$t8, $zero, $t7
	or	$t9, $t8, $t5
	j	_label_6_loop
	nop
_label_7_break:
	addiu	$s0, $zero, 0
	mov	$v0, $s0
	sw	$t9, 16($sp)
	sw	$t5, 20($sp)
	lw	$s0, 32($sp)
	lw	$s1, 36($sp)
	lw	$s2, 40($sp)
	lw	$s3, 44($sp)
	lw	$s4, 48($sp)
	lw	$s5, 52($sp)
	lw	$s6, 56($sp)
	lw	$s7, 60($sp)
	lw	$ra, 60($sp)
	addiu	$sp, $sp, 64
	jr	$ra